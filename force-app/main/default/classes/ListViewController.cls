public class ListViewController {
    @AuraEnabled(cacheable=true)
    public static List<OmniProcess> getOmniscripts() {
        
        List<OmniProcess> omniscripts = new List<OmniProcess>();
        try {
            omniscripts = [SELECT Id,Name, Type, SubType, Language, IsIntegrationProcedure, IsOmniScriptEmbeddable, 
            IsWebCompEnabled, IsActive, VersionNumber, OmniProcessType ,CustomHtmlTemplates,CustomJavaScript
     FROM OmniProcess 
     WHERE OmniProcessType = 'Omniscript' 
     ORDER BY Name ASC, VersionNumber DESC];
        } catch(Exception e) {
            // Manejar cualquier excepción que pueda ocurrir durante la consulta
            System.debug('Error: ' + e.getMessage());
        }
        return omniscripts;
    }
    @AuraEnabled
    public static void updateOmniScriptStatus(Id omniScriptId, Boolean isActive) {
        try {
            OmniProcess omniScript = [SELECT Id, IsActive FROM OmniProcess WHERE Id =: omniScriptId LIMIT 1];
            omniScript.IsActive = isActive;
            update omniScript;
        } catch (Exception e) {
            // Manejar cualquier excepción que pueda ocurrir durante la actualización
            System.debug('Error al actualizar OmniScript: ' + e.getMessage());
            throw new AuraHandledException('Error al actualizar OmniScript: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void deactivateOmniScript(List<Id> omniScriptIds) {
        List<OmniProcess> omniScriptsToUpdate = new List<OmniProcess>();

        // Recorrer los IDs y cargar los registros que se van a desactivar
        for (Id omniScriptId : omniScriptIds) {
            OmniProcess omniScript = new OmniProcess(Id = omniScriptId, IsActive = false);
            omniScriptsToUpdate.add(omniScript);
        }

        // Actualizar los registros
        try {
            update omniScriptsToUpdate;
        } catch (Exception e) {
            // Manejar cualquier excepción que pueda ocurrir durante la actualización
            System.debug('Error al desactivar OmniScripts: ' + e.getMessage());
            throw new AuraHandledException('Error al desactivar OmniScripts: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void activateOmniScript(List<Id> omniScriptIds) {
        List<OmniProcess> omniScriptsToUpdate = new List<OmniProcess>();

        // Recorrer los IDs y cargar los registros que se van a activar
        for (Id omniScriptId : omniScriptIds) {
            OmniProcess omniScript = new OmniProcess(Id = omniScriptId, IsActive = true);
            omniScriptsToUpdate.add(omniScript);
        }

        // Actualizar los registros
        try {
            update omniScriptsToUpdate;
        } catch (Exception e) {
            // Manejar cualquier excepción que pueda ocurrir durante la actualización
            System.debug('Error al activar OmniScripts: ' + e.getMessage());
            throw new AuraHandledException('Error al activar OmniScripts: ' + e.getMessage());
        }
    }
    
}