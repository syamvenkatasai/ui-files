import { Component, OnInit, EventEmitter, Input, Output, OnDestroy} from '@angular/core';
import { DynamicComponentsInterfaceComponent } from '../../dynamic-components';
import { ValuesAndDependencyStoreService } from 'src/app/field-exception/service/values-dependencies-store.service';
import { DataService } from 'src/app/core/services/serviceBridge/data.service';
import { AuthService } from 'src/app/core/services/global/authentication.service';
import { FormField } from 'src/app/core/model/dynamicForm/fields/form-field';
import { BusinessRuleService } from 'src/app/core/services/businessrules/businessrule.service';
import { ComponentStoreService } from 'src/app/core/services/component-store/component-store.service';
import { FieldProperties } from '../field-properties';
import { BizrulesService } from 'src/app/core/services/businessrules/bizrules.service';

@Component({
  selector: 'app-dynamic-number-field',
  templateUrl: './dynamic-number-field.component.html',
  styleUrls: ['./dynamic-number-field.component.scss']
})
export class DynamicNumberFieldComponent extends DynamicComponentsInterfaceComponent implements OnInit, OnDestroy {
  currentClass:any
  constructor(private valuesAndDepsStore: ValuesAndDependencyStoreService,
    private authService: AuthService, private dataService: DataService, private businessRuleService: BusinessRuleService,
    private compStore: ComponentStoreService,private rules: BizrulesService) {
    super(compStore, valuesAndDepsStore)
    this.authService.classtoAddSubject.subscribe((value) =>
   this.currentClass = value
   )

  }

  comp_id
  bOrCon = 'view'
  builderProperties
  prop_sent = false;

  text_color;
  font_size;
  font_weight;
  text_transform;
  tabWiseData
  @Input() set builderData(val) {
    this.comp_id = val.id
    if (val && val.properties) {
      this.setProperties(val.properties)
    }
    if (val) {
        this.bOrCon = val.builderOrConsumer
        if (!this.prop_sent) {
          this.sendingProperties()
        }
    }
  };
  @Output() sendProperties = new EventEmitter();

  sendingProperties() {
    this.sendProperties.emit({ properties: FieldProperties.number_field_component, id: this.comp_id });
    this.prop_sent = true
  }
  builderLabel: string
  requiredField: boolean
  fieldCheckbox: boolean
  fieldCrop: boolean
  pattern : number
  min:number
  max : number
  setProperties(e) {

    this.text_color = e.text_color || "#333333";
    this.font_size = e.font_size + 'px' || "12px";
    this.font_weight = e.font_weight || "normal"
    this.text_transform = e.text_transform || "initial"

    if (e && e.display_name) {
      this.builderLabel = e.display_name
    }
    else {
      this.builderLabel = 'Field Name'
    }

    if (e && e.mandatory) {
      this.requiredField = e.mandatory
    }
    else {
      this.requiredField = false
    }

    if (e && e.checkfield) {
      this.fieldCheckbox = e.checkfield
    }
    else {
      this.fieldCheckbox = false
    }

    if (e && e.crop) {
      this.fieldCrop = e.crop
    }
    else {
      this.fieldCrop = false
    }
    if (e && e.pattern) {
      this.pattern = e.pattern;
    }
    else{

    }
    if (e && e.min) {
      this.min = e.min;
    }
    else{
      this.min = 20
    }
    if (e && e.max) {
      this.max = e.max;
    }
    else{
      this.max = 20
    }
    this.builderProperties = e
  }

  override checkDependencyTypeandExecute(dependencyName) {
    switch(dependencyName) {
      case "load_component":
      this.loadValue('onchange')
      break;
    }
  }

  loadValue(event) {
    const value = this.valuesAndDepsStore.loadFromCommonData(this.componentProperties.source);
    if (value) {
      this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(value);
      this.runFieldLevelBusinessRule(this.componentProperties, event)
    } else {
      this.getValue(event)
    }
  }

  getValue(event) {
    const params: any = {
      component_unique_name: this.componentProperties.unique_name,
      field_unique_name: this.componentProperties.source,
      queue_id: this.authService.getSelectedQueueId(),
      case_id: this.valuesAndDepsStore.getCaseId(),
      url: this.componentProperties.url
    }
    if(this.componentProperties.params) {
      let extra_params = this.componentProperties.params.split(',')
      extra_params.forEach(param => {
        params[param.trim()] = this.valuesAndDepsStore.getParamValue(param.trim(), this.componentProperties)
      });
    }
    params.variables = {}
    if (this.componentProperties.variables) {
      this.componentProperties.variables.forEach(variable => {
        params.variables[variable.key] = variable.value;
        if (variable.key == 'row_data') {
          params.files = this.valuesAndDepsStore.getSelectedQueueData(variable.value)
        }
        if (variable.key == 'selected_file') {
          params.selected_file = this.valuesAndDepsStore.getSelectedFile(variable.value)
        }
        if (variable.key == 'tab_data') {
          try {
            params.tabs = Object.keys(this.valuesAndDepsStore.getFileTabImages(variable.value))
          } catch (error) {
            params.tabs = []
          }
        }
      });
    }

  }
  fieldChanged(e) {
    this.valuesAndDepsStore.pushFieldChanges(this.componentProperties.source)
  }

  updateValueFromResponse(resp) {
    this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, resp[this.componentProperties.source])

    let value = resp[this.componentProperties.source];
    this.formField.suspicious = false
    this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(value);
    this.runFieldLevelBusinessRule(this.componentProperties, 'onchange')
  }


  validField = true
  modified_value

  tenant_id = ''
  editedFields:any;
  override ngOnInit() {


    this.tenant_id = this.authService.getTenantId()

    if (this.bOrCon === 'builder') {

    } else {


      this.text_color = this.componentProperties['text_color'] || "#333333";
      this.font_size = (this.componentProperties['font_size'] * 0.06) + 'em' || "12px";
      this.font_weight = this.componentProperties['font_weight'] || "normal"
      this.text_transform = this.componentProperties['text_transform'] || "initial"


      this.loadValue('onload');
      this.editedFields=this.valuesAndDepsStore.loadFromCommonData("edited_fields")
      if (this.editedFields){
      this.editedFields=JSON.parse(this.editedFields);
      this.valuesAndDepsStore.storeEditedFields(this.editedFields);
      }else{
        this.editedFields=[];
      }
      this.authService.updateFormValues.subscribe(value => {
        this.updateValueFromResponse(value)
      });

      this.valuesAndDepsStore.updateValuesNext.subscribe(data => {
        if (data && data.component_id === this.componentProperties.unique_name) {
          this.componentProperties.value = data.value
          this.modified_value = data.value
          this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(data.value);
          if(this.modified_value){
            this.keyclicked = true
          }
          else{
            this.keyclicked = false

          }
          this.hasValue()
          this.getkeyPressed()
          this.check();

        }
        if (data && data.source_name === this.componentProperties.source) {
          let tabName
          if ((this.authService.getSelectedQueueId() === 10 || this.authService.getSelectedQueueId() === 11) && this.authService.getTenantId() === "ambanketrade"){
            this.tabWiseData = this.valuesAndDepsStore.getTabWiseData();
           tabName = this.authService.getSelectedTabId();

           if (tabName && this.tabWiseData[tabName["tab_name"]] && this.tabWiseData[tabName["tab_name"]].hasOwnProperty(this.componentProperties.source) ){
            this.tabWiseData[tabName["tab_name"]][this.componentProperties.source] = data.value
            this.valuesAndDepsStore.setTabWiseData(this.tabWiseData)
           }else{
            if (tabName && this.tabWiseData[tabName["tab_name"]]){
              this.tabWiseData[tabName["tab_name"]][this.componentProperties.source] = data.value
              this.valuesAndDepsStore.setTabWiseData(this.tabWiseData)

            }
           }

           if (this.tabWiseData[tabName["tab_name"]]["edited_fields"]){
    
           }else{
            this.tabWiseData[tabName["tab_name"]]["edited_fields"] = []
           }
           if (this.tabWiseData[tabName["tab_name"]]["edited_fields"].includes(this.componentProperties.source)){
    
           }else{
            this.tabWiseData[tabName["tab_name"]]["edited_fields"].push(this.componentProperties.source)
            this.valuesAndDepsStore.setTabWiseData(this.tabWiseData)
           }

           
        }
          this.componentProperties.value = data.value
          this.modified_value = data.value
          this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(data.value);
          if(this.modified_value){
            this.keyclicked = true
            this.check();
          }
          else{
            this.keyclicked = false
          }
          this.getkeyPressed()
          this.valuesAndDepsStore.setCropClickedData({});
          this.cropClickedData = this.valuesAndDepsStore.getCropClickedData();
          this.editedFields = this.valuesAndDepsStore.getEditedFields();

          if (!this.editedFields.includes(this.componentProperties.source)) {
            this.editedFields.push(this.componentProperties.source);
          }

          this.valuesAndDepsStore.storeEditedFields(this.editedFields);


        }
        this.runFieldLevelBusinessRule(this.componentProperties, 'onchange')
      })


      this.runFieldLevelBusinessRule(this.componentProperties, 'onload')

      this.authService.invalidFieldCheck.subscribe(value => {
        let field_form = this.componentProperties.formgroup.get(this.componentProperties.source)
        if (field_form && field_form.status === 'INVALID') {
          this.validField = false
        }
        else {
          this.validField = true
        }
      })

    }


  }

  override runFieldLevelBusinessRule(formField, event_type?: any) {

    if (formField.rules_list && formField.rules_list.length > 0) {
      this.rules.evaluateRules(formField, event_type)
    }
  }

  hasValue(){

    let val = this.componentProperties.formgroup.controls[this.componentProperties.source].value


    if(this.keyclicked == true){
      return false
    }
    else{

      if(this.authService.getTenantId() !== 'ambankdisbursement'){
        let list = this.valuesAndDepsStore.getGlobalList()
        let flag = true
        if(val){

          return flag
        }
        else{
          if(val){
            return true
          }
          else{
            return false
          }
        }
      }
      else{
        let get_Biz_Fields = this.valuesAndDepsStore.loadFromCommonData("Biz_Fields") ? JSON.parse(this.valuesAndDepsStore.loadFromCommonData("Biz_Fields")) : []
        if(get_Biz_Fields.length > 0 && get_Biz_Fields.includes(this.componentProperties.source)){
          if(val){
              return true;
            }
          else{
              return false
          }
        }
        else{
          let confidence_levels = this.valuesAndDepsStore.loadFromCommonData("suspicious") ? JSON.parse(this.valuesAndDepsStore.loadFromCommonData("suspicious")) : {}
          if (confidence_levels !== undefined){
            let key = this.componentProperties.source
            if (confidence_levels.hasOwnProperty(key) && val){
                if ( confidence_levels[key] && confidence_levels[key]["extracted_threshold"] < confidence_levels[key]["field_confidence"]){
                  return false
                }
                else{
                  return true
                }
            }
            else{
              return false
            }
          }
          else{
            return false
          }
        }
      }

    }

  }
    check(){

      let list = this.valuesAndDepsStore.getGlobalList();
      let index =  list[this.valuesAndDepsStore.getCaseId()].indexOf(this.componentProperties.source);
      if (index !== -1) {

      }
      else{
        list[this.valuesAndDepsStore.getCaseId()].push(this.componentProperties.source)
      }
    }


    getFormValue(){
      return this.componentProperties.formgroup.controls[this.componentProperties.source].value
    }

    getkeyPressed(){
      return this.keyclicked
    }

  storeListOfCustomFields = []
  keyclicked = false

  keyUpCheck(e) {
    //console.log(e)
    this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, e.target.value)
    let caseId = this.valuesAndDepsStore.getCaseId();
    this.editedFields=this.valuesAndDepsStore.getEditedFields();
    if (this.editedFields && this.editedFields.length>0 && this.editedFields.includes(this.componentProperties.source)){

    }else{
      this.editedFields.push(this.componentProperties.source);

    }

    this.valuesAndDepsStore.storeEditedFields(this.editedFields);

    if (this.componentProperties.allowed_chars) {
      return this.componentProperties.allowed_chars.indexOf(e.key) > -1
    }

    if (this.componentProperties.disallowed_chars) {
      return this.componentProperties.disallowed_chars.indexOf(e.key) == -1
    }


      let list = this.valuesAndDepsStore.getGlobalList()
      if(e.keyCode != 9){
        if(e.target.value){
            if (caseId){
            let index =  list[this.valuesAndDepsStore.getCaseId()].indexOf(this.componentProperties.source);
                if (index !== -1) {

                }
                else{
                  list[this.valuesAndDepsStore.getCaseId()].push(this.componentProperties.source)
                }
              }
          console.log(list)
          this.keyclicked = true
        }
        else{
          this.keyclicked = false
            }
          this.getkeyPressed()
      }


    return true
  }

  hasValueinEditedFields(){
    this.editedFields = this.valuesAndDepsStore.getEditedFields();
    let tabName = this.authService.getSelectedTabId()
    this.editedFields = this.valuesAndDepsStore.getEditedFields();
    // console.log(this.editedFields)
    this.tabWiseData = this.valuesAndDepsStore.getTabWiseData();
    if (this.tenant_id === "ambanketrade" && (this.authService.getSelectedQueueId() === 10 || this.authService.getSelectedQueueId() === 11)){
      this.editedFields = []
      if (tabName && this.tabWiseData.hasOwnProperty(tabName["tab_name"])){

        if (this.tabWiseData.hasOwnProperty(tabName["tab_name"]) && this.tabWiseData[tabName["tab_name"]].hasOwnProperty("edited_fields")) {
          this.editedFields = this.tabWiseData[tabName["tab_name"]]["edited_fields"];
        } else {
          // Handle the case when "edited_fields" is not present
          this.tabWiseData[tabName["tab_name"]]["edited_fields"] = []
          this.editedFields = this.tabWiseData[tabName["tab_name"]]["edited_fields"];
          this.valuesAndDepsStore.setTabWiseData(this.tabWiseData)

        }

      }

     


    }
    if (this.editedFields && this.editedFields.length>0 && this.editedFields.includes(this.componentProperties.source)){
        return true;
    }
    return false;

  }


    keyDownCheck(e){

      if(e.keyCode != 9){
        if(e.target.value){
        this.keyclicked = true;
        }
        else{
          this.keyclicked = false;
        }
      this.getkeyPressed()
      }
    }

    ngOnDestroy(): void {
      this.valuesAndDepsStore.setCropClickedData({});
  }
}
