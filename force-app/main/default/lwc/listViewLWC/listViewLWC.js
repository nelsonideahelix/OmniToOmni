import { LightningElement, wire, track, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getOmniscripts from '@salesforce/apex/ListViewController.getOmniscripts';
import deactivateOmniScript from '@salesforce/apex/ListViewController.deactivateOmniScript';
import activateOmniScript from '@salesforce/apex/ListViewController.activateOmniScript';

const FILTER_ALL = 'All';
const FILTER_ACTIVE = 'Active';
const FILTER_INACTIVE = 'Inactive';
const FILTER_LWCENABLED = 'LWC Enabled';
const FILTER_LWCDISABLED = 'LWC Disabled';

const columns = [
    { type: 'checkbox', fieldName: 'isSelected', label: 'Select' },
    { label: 'Name', fieldName: 'Name', type: 'text' },
    { label: 'Type', fieldName: 'Type', type: 'text' },
    { label: 'Active', fieldName: 'IsActive', type: 'boolean', typeAttributes: { iconName: 'utility:check', class: 'slds-icon-text-success' } },
    { label: 'Is web component Enabled', fieldName: 'IsWebCompEnabled', type: 'boolean', typeAttributes: { iconName: 'utility:check', class: 'slds-icon-text-success' } },
    { label: 'Custom HTML', fieldName: 'Custom HTML', type: 'boolean', typeAttributes: { iconName: 'utility:check', class: 'slds-icon-text-success' } },
    { label: 'Version', fieldName: 'VersionNumber', type: 'text' } // Agregar columna para VersionNumber
    // Agrega otros campos aquí según tus necesidades
];


export default class listViewLWC extends LightningElement {

    @track omniScripts;
    @track groupedOmniscripts = [];
    @track showSpinner = true;
    activeFilter = FILTER_ALL;

    showModal = false;
    modalTitle = 'Modal';
    customHTML = '';
    customJS = '';
    showCustomHTML = false;
    showCustomJS = false;
    isDeactivateButtonDisabled = true;
    isActivateButtonDisabled = true;

    filterOptions = [
        { label: 'All', value: FILTER_ALL },
        { label: 'Active', value: FILTER_ACTIVE },
        { label: 'Inactive', value: FILTER_INACTIVE },
        { label: 'LWC Enabled', value: FILTER_LWCENABLED },
        { label: 'LWC Disabled', value: FILTER_LWCDISABLED }
    ];

    connectedCallback() {
        this.activeFilter = FILTER_ALL;
        //this.wiredOmniscripts();
        //this.loadData(); // Llama a la función para cargar los datos cuando el componente se inicia
        //this.isDeactivateButtonDisabled = true;
        //this.isActivateButtonDisabled = true;
    }

    //Apex para hacer refresh, no funciona.
    loadData() {
        return refreshApex(this.omniScripts); // Actualiza los datos utilizando el @wire
    }


    @wire(getOmniscripts)
    wiredOmniscripts({ error, data }) {
        if (data) {
            // Agregar la propiedad isSelected a cada registro y luego asignar los datos a omniScripts
            this.omniScripts = data.map(record => ({ ...record, isSelected: false }));
            this.filterOmniScripts();
        } else if (error) {
            console.error(error);
            this.showSpinner = false;
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
        this.showSpinner = false;
    }

    handleNameClick(event) {
        console.log('INICIA');
        this.showModal = true; 
        const omniScriptId = event.currentTarget.dataset.id;
        //const omniScriptId = '0jNHn000000PDueMAG';
        console.log('omniScriptId:===>'+ omniScriptId);
        const omniScript = this.omniScripts.find(script => script.Id === omniScriptId);
    
        console.log('OmniScript:', omniScript);
    
        
            this.modalTitle = omniScript.Name;
            this.customHTML = omniScript.CustomHtmlTemplates;
            this.customJS = omniScript.CustomJavaScript;
            console.log('this.customJS===>'+ this.customJS);
            this.showCustomHTML = !!this.customHTML;
                if(this.showCustomHTML == false){
                    this.customHTML = 'There is no HTML to Show';
                }
           
            this.showCustomJS = !!this.customJS;
            console.log('modalTitle:', this.modalTitle);
            console.log('customHTML:', this.customHTML);
            console.log('customJS:', this.customJS);
       
    }
   

    closeModal() {
        this.showModal = false;
    }

    handleConversionHTML(event){}



    handleCheckboxChange(event) {
        // Obtén el ID y el estado de la casilla de verificación (activada o desactivada) de la fila seleccionada.
        const omniScriptId = event.target.dataset.id;
        console.log(omniScriptId);
        const isChecked = event.target.checked;
        console.log(isChecked);
        // Actualiza el estado de isSelected para la fila seleccionada en el arreglo filteredOmniScripts.
        this.filteredOmniScripts = this.filteredOmniScripts.map(script => {
            if (script.Id === omniScriptId) {
                script.isSelected = isChecked;
            }
            return script;
        });

        // Verifica si al menos una fila está seleccionada y si todas las seleccionadas tienen IsActive como true o false.
        const allSelectedRows = this.filteredOmniScripts.filter(script => script.isSelected);
        const allActive = allSelectedRows.every(script => script.IsActive);
        const allInactive = allSelectedRows.every(script => !script.IsActive);

        // Habilita o deshabilita los botones "Deactivate" y "Activate" según el estado de las filas seleccionadas.
        this.isDeactivateButtonDisabled = !allActive || allSelectedRows.length === 0;
        
        this.isActivateButtonDisabled = !allInactive || allSelectedRows.length === 0;
        //console.log(isActivateButtonDisabled);
    }



    handleDeactivateClick() {
        this.showSpinner = true;
        const selectedOmniScriptIds = this.getSelectedOmniScriptIds();
        console.log('nelson tru label :'+selectedOmniScriptIds);
        console.log('before update: '+JSON.stringify(this.filteredOmniScripts));
        this.changeActiveStatus(selectedOmniScriptIds, false);
        if (selectedOmniScriptIds.length > 0) {
            deactivateOmniScript({ omniScriptIds: selectedOmniScriptIds })
                .then(result => {
                    this.showToast('Success', 'OmniScripts Deactivated successfully', 'success');
                    refreshApex(this.wiredOmniscripts);
                    // windows.location.reload();
                    // No necesitas llamar a refreshOmniScripts si usas @wire para obtener datos
                    //this.loadData();
                    console.log('after update: '+JSON.stringify(this.filteredOmniScripts));
                    
                    this.filterOmniScripts();
                    
                })
                .catch(error => {
                    console.error('Error deactivating OmniScripts: ', error);
                    this.showToast('Error', 'Failed to deactivate OmniScripts', 'error');
                    this.showSpinner = false;
                });
        } else {
            // Manejar caso donde no se seleccionaron OmniScripts para desactivar
            this.showToast('Error', 'No OmniScripts selected for deactivation', 'error');
        }
    }
    changeActiveStatus(omnisId, newStatus){
        for (let i = 0; i < this.filteredOmniScripts.length; i++) {
            if (omnisId.includes(this.filteredOmniScripts[i].Id)) {
                this.filteredOmniScripts[i].IsActive = newStatus;
            }
        }
    }

    handleActivateClick() {
        this.showSpinner = true;
        const selectedOmniScriptIds = this.getSelectedOmniScriptIds();
        this.changeActiveStatus(selectedOmniScriptIds, true);
        if (selectedOmniScriptIds.length > 0) {
            console.log('before update: '+this.filteredOmniScripts);
            activateOmniScript({ omniScriptIds: selectedOmniScriptIds })
                .then(result => {
                    this.showToast('Success', 'OmniScripts Activated successfully', 'success');
                    refreshApex(this.wiredOmniscripts);
                    console.log('after update: '+this.filteredOmniScripts);
                    // windows.location.reload();
                    // No necesitas llamar a refreshOmniScripts si usas @wire para obtener datos
                    //this.loadData();
                    
                    this.filterOmniScripts();
                    
                })
                .catch(error => {
                    console.error('Error deactivating OmniScripts: ', error);
                    this.showToast('Error', 'Failed to deactivate OmniScripts', 'error');
                    this.showSpinner = false;
                });
        } else {
            // Manejar caso donde no se seleccionaron OmniScripts para desactivar
            this.showToast('Error', 'No OmniScripts selected for Activatation', 'error');
        }
    }

    getSelectedOmniScriptIds() {
        const selectedOmniScripts = this.filteredOmniScripts.filter(script => script.isSelected);
        return selectedOmniScripts.map(script => script.Id);
    }

    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toastEvent);
    }

}
