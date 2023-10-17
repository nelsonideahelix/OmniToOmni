import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getOmniscripts from '@salesforce/apex/ListViewController.getOmniscripts';
const FILTER_ALL = 'All';
const FILTER_ACTIVE = 'Active';
const FILTER_INACTIVE = 'Inactive';
const FILTER_LWCENABLED ='LWC Enabled';
const FILTER_LWCDISABLED = 'LWC Disabled';

const columns = [
    { type: 'checkbox', fieldName: 'isSelected', label: 'Select' },
    { label: 'Name', fieldName: 'Name', type: 'text' },
    { label: 'Type', fieldName: 'Type', type: 'text' },
    { label: 'Active', fieldName: 'IsActive', type: 'boolean', typeAttributes: { iconName: 'utility:check', class: 'slds-icon-text-success' } },
    { label: 'Is web component Enabled', fieldName: 'IsWebCompEnabled', type: 'boolean', typeAttributes: { iconName: 'utility:check', class: 'slds-icon-text-success' } },
    { label: 'Version', fieldName: 'VersionNumber', type: 'text' } // Agregar columna para VersionNumber
    // Agrega otros campos aquí según tus necesidades
];


export default class listViewLWC extends LightningElement {

    omniScripts;
    groupedOmniscripts = [];
    activeFilter = FILTER_ALL;

    showModal = false;
    modalTitle = 'Modal';
    customHTML = '';
    customJS = '';
    showCustomHTML = false;
    showCustomJS = false;

    filterOptions = [
        { label: 'All', value: FILTER_ALL },
        { label: 'Active', value: FILTER_ACTIVE },
        { label: 'Inactive', value: FILTER_INACTIVE },
        { label: 'LWC Enabled', value: FILTER_LWCENABLED },
        { label: 'LWC Disabled', value: FILTER_LWCDISABLED }
    ];

    connectedCallback() {
        this.activeFilter = FILTER_ALL;
        this.loadData(); // Llama a la función para cargar los datos cuando el componente se inicia
        
    }
    //Apex para hacer refresh, no funciona.
    loadData() {
        return refreshApex(this.omniScripts); // Actualiza los datos utilizando el @wire
    }

    // @wire(getOmniscripts)
    // wiredOmniscripts(result) {
    //     this.omniScripts = result;
    //     if (result.data) {
    //         // Realizar acciones adicionales después de cargar los datos, si es necesario
    //     }
    // }
    @wire(getOmniscripts)
    wiredOmniscripts({ error, data }) {
        if (data) {
            // Agregar la propiedad isSelected a cada registro y luego asignar los datos a omniScripts
            this.omniScripts = data.map(record => ({ ...record, isSelected: false }));
            this.filterOmniScripts();
        } else if (error) {
            console.error(error);
        }
    }

    

    columns = columns;

    groupOmniscripts() {
        const groupedScripts = {};
        this.omniScripts.forEach(script => {
            if (!groupedScripts[script.Name]) {
                groupedScripts[script.Name] = [];
            }
            groupedScripts[script.Name].push(script);
        });

        this.groupedOmniscripts = Object.keys(groupedScripts).map(key => {
            return {
                name: key,
                items: groupedScripts[key],
                isExpanded: false
            };
        });
    }

    handleDropdownToggle(event) {
        const name = event.target.title;
        const group = this.groupedOmniscripts.find(item => item.name === name);
        group.isExpanded = !group.isExpanded;
        this.groupedOmniscripts = [...this.groupedOmniscripts];
    }
    handleRowSelection(event) {
        this.selectedRecords = event.detail.selectedRows;
    }

 

handleFilterChange(event) {
    this.activeFilter = event.detail.value;
    this.filterOmniScripts();
}

filterOmniScripts() {
    if (this.activeFilter === FILTER_ALL) {
        this.filteredOmniScripts = this.omniScripts;
    } else {
        this.filteredOmniScripts = this.omniScripts.filter(script => {
            const isActiveFilter = this.activeFilter === FILTER_ACTIVE ? script.IsActive : this.activeFilter === FILTER_INACTIVE ? !script.IsActive : true;
            const isLwcEnabledFilter = this.activeFilter === FILTER_LWCENABLED ? script.IsWebCompEnabled : this.activeFilter === FILTER_LWCDISABLED ? !script.IsWebCompEnabled : true;
            return isActiveFilter && isLwcEnabledFilter;
        });
    }
}

handleNameClick(event) {
    const omniScriptId = event.currentTarget.dataset.id;
    const omniScript = this.omniScripts.find(script => script.Id === omniScriptId);

    this.modalTitle = omniScript.Name;
    this.customHTML = omniScript.CustomHtmlTemplates;
    this.customJS = omniScript.CustomJavaScript;
    this.showCustomHTML = !!this.customHTML;
    this.showCustomJS = !!this.customJS;
    this.showModal = true;
}

closeModal() {
    this.showModal = false;
}

openmodal() {
    this.showModal = true;
}



handleCheckboxChange(event) {
    const omniScriptId = event.target.dataset.id;
    const isChecked = event.target.checked;

    // Actualiza el estado de isSelected para la fila seleccionada
    this.filteredOmniScripts = this.filteredOmniScripts.map(script => {
        if (script.Id === omniScriptId) {
            script.isSelected = isChecked;
        }
        return script;
    });

    // Verifica si al menos una fila está seleccionada y todas las seleccionadas tienen IsActive como true o false
    const allSelectedRows = this.filteredOmniScripts.filter(script => script.isSelected);
    const allActive = allSelectedRows.every(script => script.IsActive);
    const allInactive = allSelectedRows.every(script => !script.IsActive);

    // Habilita o deshabilita los botones Deactivate y Activate según el estado de las filas seleccionadas
    this.isDeactivateButtonDisabled = !allActive || allSelectedRows.length === 0;
    this.isActivateButtonDisabled = !allInactive || allSelectedRows.length === 0;
}


handleDeactivateClick() {
    const selectedOmniScriptIds = this.getSelectedOmniScriptIds();
    if (selectedOmniScriptIds.length > 0) {
        this.showSpinner();
        deactivateOmniScript({ omniScriptIds: selectedOmniScriptIds })
            .then(result => {
                this.hideSpinner();
                this.showToast('Success', 'OmniScripts Deactivated successfully', 'success');
                this.refreshOmniScripts();
            })
            .catch(error => {
                this.hideSpinner();
                this.showToast('Error', 'Failed to deactivate OmniScripts', 'error');
            });
    }
}

handleActivateClick() {
    const selectedOmniScriptIds = this.getSelectedOmniScriptIds();
    if (selectedOmniScriptIds.length > 0) {
        activateOmniScript({ omniScriptIds: selectedOmniScriptIds })
            .then(result => {
                // Lógica para manejar la respuesta de la activación
            })
            .catch(error => {
                // Manejar errores si es necesario
            });
    }
}

getSelectedOmniScriptIds() {
    const selectedOmniScripts = this.filteredOmniScripts.filter(script => script.isSelected);
    return selectedOmniScripts.map(script => script.Id);
}



}
