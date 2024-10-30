import { Component, OnInit, Input, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { DynamicComponentsInterfaceComponent } from '../../dynamic-components';
import { ValuesAndDependencyStoreService } from 'src/app/field-exception/service/values-dependencies-store.service';
import { AuthService } from 'src/app/core/services/global/authentication.service';
import { DataService } from 'src/app/core/services/serviceBridge/data.service';
import { FormField } from 'src/app/core/model/dynamicForm/fields/form-field';
import { BusinessRuleService } from 'src/app/core/services/businessrules/businessrule.service';
import { ComponentStoreService } from 'src/app/core/services/component-store/component-store.service';
import { FieldProperties } from '../field-properties';
import { BizrulesService } from 'src/app/core/services/businessrules/bizrules.service';
import { MaskEventService } from 'src/app/core/services/mask-event.service';
import { DynamicAdacdComponent } from './dynamic-adacd/dynamic-adacd.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DatePickerDialogComponent } from '../../date-picker-dialog/date-picker-dialog.component';
import * as moment from 'moment';
import { forEach } from 'jszip';


@Component({
  selector: 'app-dynamic-text-field',
  templateUrl: './dynamic-text-field.component.html',
  styleUrls: ['./dynamic-text-field.component.scss'],
})
export class DynamicTextFieldComponent extends DynamicComponentsInterfaceComponent implements OnInit, OnDestroy{
  currentClass:any
  constructor(private dialog: MatDialog,private valuesAndDepsStore: ValuesAndDependencyStoreService, private maskEvent: MaskEventService,
    private authService: AuthService, private dataService: DataService, private businessRuleService: BusinessRuleService, private compStore: ComponentStoreService, private rules: BizrulesService) {
    super(compStore, valuesAndDepsStore)
    this.authService.classtoAddSubject.subscribe((value) =>
   this.currentClass = value
   )
  }
  @HostListener('document:click', ['$event']) onDocumentClick(event) {
    this.show_suggestions = false;
  }
  comp_id
  bOrCon = 'view'
  builderProperties
  prop_sent = false;
  failureMessage: any
  strictCheck:boolean = false;
  showCalender:boolean = false;
  tabWiseData
  tabWiseChangedData
  patternFailureMsg:any;


  @Input() set builderData(val) {
    this.comp_id = val.id
    if (val && val.properties) {
      this.setProperties(val.properties)
    }
    this.bOrCon = val.builderOrConsumer
  };
  @Output() sendProperties = new EventEmitter();

  sendingProperties() {
    this.sendProperties.emit({ properties: FieldProperties.text_field_component, id: this.comp_id });
    this.prop_sent = true
  }

  builderLabel: string
  requiredField: boolean
  fieldCheckbox: boolean
  fieldCrop: boolean
  failurecolor
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
    this.builderProperties = e
  }

  loadCompoenent() {

  }


  text_color;
  font_size;
  font_weight;
  text_transform;
  mandatory
  modified_value

  validField = true
  show_search_icon = false
  randomId = ""
  show_add_btn = false
  text = ''
  tenant_id = ''
  type = ''
  uniqueName;
  editedFields:any;
  dateFormats:any = [];
  override ngOnInit() {
    this.authService.classtoAddSubject.next(this.authService.getCurrentTheme());
    this.uniqueName = ""

    this.tenant_id = this.authService.getTenantId()
    this.tabWiseData = this.valuesAndDepsStore.getTabWiseData();
    this.tabWiseChangedData = this.valuesAndDepsStore.getmultiTabTabWiseChangeData();


    this.randomId = this.authService.randomID(6);
    if (this.bOrCon != 'builder' && this.componentProperties) {
      this.text_color = this.componentProperties['text_color'] || "#333333";
      this.font_size = (this.componentProperties['font_size'] * 0.06) + 'em' || "12px";
      this.font_weight = this.componentProperties['font_weight'] || "normal"
      this.text_transform = this.componentProperties['text_transform'] || "initial"
      this.mandatory = this.componentProperties['mandatory'] || false;
      this.type = this.componentProperties["type"]
      this.formField.pattern = this.componentProperties["pattern"]
      this.patternFailureMsg=this.componentProperties["pattern_failure_message"];
      this.showCalender = this.componentProperties["show_calender"];
      this.dateFormats = [
        'MMMM DD, YYYY', // 'SEPT 15, 2023'
        'DD-MMM-YY',    // '27-Nov-23'
        'DD/MM/YYYY',
        'DD-MM-YYYY',   // '27-11-2023'
        'YYYY-MM-DD',   // '2023-11-27'
        'MM/DD/YYYY',   // '11/27/2023'
        'MMM DD, YYYY', // 'Nov 27, 2023'
        'DD/MM/YYYY',   // '27/11/2023'
        'DD/MM/YY',     // '27/11/23'
        'DD.MM.YYYY',
        'MMM-YY',       // 'Sep-23'
        'DD/MMM/YY',    // '30/Oct/24'
        'MMM/YY',
        'DD/MMM/YYYY',  // '30/Oct/2023'
        'MMMM D, YYYY',  // 'December 31, 2023'
        'MMM YYYY',      // 'Sep 2023'
        'Do MMM, YYYY',  // '30th Sep, 2024'
        'Do MMM,YYYY',   // '30th Sep, 2024'
        'MMMM D, YYYY',  // 'October 31, 2023'
        'MMMM D,YYYY',   // 'October 31, 2023'
        'Do MMMM-YYYY',  // '31st OCTOBER-2023'
        'DD /MM/YYYY',   // '31 /08/2023'
        'DD-MMM-YYYY',   // '20-Jun-2024'
        'DD MM YYYY',    // '11 11 2023'
        'D [st|nd|rd|th] MMM YY', // '1st Jan 24'
        'D MMM YY',      // '1 Jan 14'
        'D-MMMM-YY',     // '1-Sept-24'
        'D-MMM-YY',
        'DD-MMM-YY',
        'YYYY-MM-DDTHH:mm:ssZ',
      ];

      this.loadValue('onload')

      this.editedFields=this.valuesAndDepsStore.loadFromCommonData("EDITED_FIELDS")

      if (typeof this.editedFields === "string"){
        this.editedFields = JSON.parse(this.editedFields)
      }
      if (this.editedFields && this.editedFields.length>0){
      this.valuesAndDepsStore.storeEditedFields(this.editedFields);
      }else{
        this.editedFields=[];
      }

      this.authService.updateFormValues.subscribe(value => {
        if(value && value.hasOwnProperty(this.componentProperties.source)){
          this.updateValueFromResponse(value)
        }
        
      });

      this.valuesAndDepsStore.updateValuesNext.subscribe(data => {

        this.uniqueName = this.valuesAndDepsStore.getUniqueName();
        if (data && data.source_name === this.componentProperties.source) {
          this.valuesAndDepsStore.setUniqueName("");

          if(this.showCalender){
            let cleanedValue = this.removeOrdinalSuffix(data.value);
            let reqValue = this.formatDateToDDMMYYYY(cleanedValue);
            if(reqValue != null){
              data.value = reqValue;
            }
          }
        this.componentProperties.value = data.value
          this.modified_value = data.value
          this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(data.value);
          this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, data.value)
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
            this.valuesAndDepsStore.setComponentCommonDataProp("edited_fields",this.editedFields);
            this.valuesAndDepsStore.setComponentCommonDataProp("EDITED_FIELDS",this.editedFields);
            
          }

          this.valuesAndDepsStore.storeEditedFields(this.editedFields);

        this.runFieldLevelBusinessRule(this.componentProperties, 'onchange')
      }
    })

      this.authService.invalidFieldCheck.subscribe(value => {
        let field_form = this.componentProperties.formgroup.get(this.componentProperties.source)
        if (field_form && field_form.status === 'INVALID') {
          this.validField = false
        }
        else {
          this.validField = true
        }
      })

      this.authService.update_text_field.subscribe(val=>{
        this.loadValue('onchange')
      })

      let variables = this.componentProperties.variables
      for (let i = 0; i < variables.length; i++) {
        if(this.componentProperties.variables[i].key == "Suggestions" && variables[i].value == "true"){
          this.show_search_icon = true
        }

        if(this.componentProperties.variables[i].key == "Add ACD" && variables[i].value == "true"){
          this.show_add_btn  = true
          this.text =this.componentProperties.variables[i].key
        }
      }
    }
     //console.log(this.show_suggestions)
  }

  getFormValue(){
    return this.componentProperties.formgroup.controls[this.componentProperties.source].value
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

  override checkDependencyTypeandExecute(dependencyName) {
    switch(dependencyName) {
      case "load_component":
        this.loadValue('onchange')
        break;
    }
  }

  hasLetters(){

    return this.hasLettersValue
  }

  hasLettersValue = false
  containsLetters(number) {
    // Convert the number to a string
    if(number){
      let strNumber = number.toString();
      // Use a regular expression to test if the string contains letters
      return /[a-zA-Z]/.test(strNumber);
    }
    else{
      return false
    }
  }

  cropFieldClicked2(form){
    this.uniqueName = form.source;
    this.valuesAndDepsStore.setUniqueName(this.uniqueName)

  }


  loadValue(event) {

    if (this.tenant_id === "ambanketrade" && (this.authService.getSelectedQueueId() === 10 || this.authService.getSelectedQueueId() === 11)){
      this.componentProperties.formgroup.controls[this.componentProperties.source].setValue("");
    }


    const value = this.valuesAndDepsStore.loadFromCommonData(this.componentProperties.source);

    if(this.componentProperties["strictcheck"]){

      if(this.containsLetters(value)){
        this.hasLettersValue = true
      }
      else{
        this.hasLettersValue = false
      }
    }
    if (value) {
       this.modified_value = ""
      try {

        if(value && (value.indexOf('suspicious') > -1 || value.indexOf('SUSPICIOUS') > -1) ){
          this.formField.suspicious = true
          this.modified_value = value.replace(/suspicious/g, '')
          if (value.indexOf('SUSPICIOUS') > -1){
            this.modified_value = value.replace(/SUSPICIOUS/g, '')
          }
        }

        else if(value ){
          this.modified_value = value.replaceAll(/\[|\]/g, '').replaceAll(/"/g, '');
          if(this.showCalender && typeof this.modified_value == 'string'){
            const momentValue = moment(this.modified_value, this.dateFormats, true); // Parse string into Moment object
            if (momentValue.isValid()) { // Check if the string was a valid date
              const cleanedValue = this.removeOrdinalSuffix(momentValue.format()); // Convert Moment to string
              const reqValue = this.formatDateToDDMMYYYY(cleanedValue); // Format as required
              if(reqValue){
                this.modified_value = reqValue;
                this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(reqValue);
                this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, reqValue);
              }

            }
          }
        }
        else{
          this.formField.suspicious = false
          this.modified_value = value
        }

      } catch (error) {
        this.modified_value = String(value)
      }

      this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(this.modified_value);
      this.runFieldLevelBusinessRule(this.componentProperties, event)
      this.getValue(event)
      this.getFailureMessage()
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
        if (variable.key == 'fields') {
          let field_keys = variable.value.split(",")

          field_keys.forEach(element => {
            let key_name = element.trim()
            params[key_name] = this.componentProperties.formgroup.controls[key_name].value
          });
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

  updateValueFromResponse(resp) {
    if (resp.hasOwnProperty("failures")){
      this.valuesAndDepsStore.setFailureData(resp.failures)
    }

    if(resp[this.componentProperties.source]){
      this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, resp[this.componentProperties.source] )
    }

    this.editedFields=this.valuesAndDepsStore.loadFromCommonData("EDITED_FIELDS")


    if (typeof this.editedFields === "string"){
      this.editedFields = JSON.parse(this.editedFields)
    }
    if (this.editedFields && this.editedFields.length>0){
    this.valuesAndDepsStore.storeEditedFields(this.editedFields);
    }else{
      this.editedFields=[];
    }

    let value = (resp[this.componentProperties.source] || "").toString();

    if(this.componentProperties["strictcheck"]){

      if(this.containsLetters(value)){
        this.hasLettersValue = true
      }
      else{
        this.hasLettersValue = false
      }
    }


    if(value && (value.indexOf('suspicious') > -1 || value.indexOf('SUSPICIOUS') > -1) ){
      this.formField.suspicious = true
      value = value.replace(/suspicious/g, '')
      if (value.indexOf('SUSPICIOUS') > -1){
        value = value.replace(/SUSPICIOUS/g, '')
      }
    }
    else if(value ){
      value = value.replaceAll(/\[|\]/g, '').replaceAll(/"/g, '');

      if(this.showCalender && typeof value == 'string'){
        const momentValue = moment(value, this.dateFormats, true); // Parse string into Moment object
        if (momentValue.isValid()) { // Check if the string was a valid date
          const cleanedValue = this.removeOrdinalSuffix(momentValue.format()); // Convert Moment to string
          const reqValue = this.formatDateToDDMMYYYY(cleanedValue); // Format as required
          if(reqValue){
            this.modified_value = reqValue;
            value = reqValue;
            this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(reqValue);
            this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, reqValue);
          }

        }
      }
    }
    else{
      this.formField.suspicious = false
    }
    this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(value);
    this.runFieldLevelBusinessRule(this.componentProperties, 'onchange')

    setTimeout(() => {
      this.getFailureMessage();
    }, 2000);
  }

  getFailureMessage() {
    this.failureMessage = this.valuesAndDepsStore.getFailureData(this.componentProperties.source)
  }

  override runFieldLevelBusinessRule(formField, event_type?: any) {
    if (formField.rules_list && formField.rules_list.length > 0) {
      this.rules.evaluateRules(formField, event_type)
    }
  }

  logThis(t) {
    if (t.source === 'invoice_amt') {
      //console.log(t);
    }

  }
  appendSuggestions = []
  show_suggestions = false
  fieldChanged(e) {


    this.valuesAndDepsStore.pushFieldChanges(this.componentProperties.source)
    setTimeout(() => {
    this.runFieldLevelBusinessRule(this.componentProperties, 'onchange')
    },2000)
  }



  listItem(item){
    this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(item);
    this.show_suggestions = false
  }

  getSuggestions(){
    return this.filteredSuggestions;
  }

  checkDisabled() {
    return !this.componentProperties.editable || this.componentProperties.disabled
  }

  storeListOfCustomFields = []
  keyclicked = false
  checkFieldLevelDataForGroupedTabs(val){

    let tabName
    this.valuesAndDepsStore.setUniqueName("");
    this.tabWiseData = this.valuesAndDepsStore.getTabWiseData();
    tabName = this.authService.getSelectedTabId();
    this.tabWiseChangedData = this.valuesAndDepsStore.getmultiTabTabWiseChangeData();
    if (this.tabWiseChangedData.hasOwnProperty(tabName["tab_name"])){
       this.tabWiseChangedData[tabName["tab_name"]] = {...this.tabWiseChangedData[tabName["tab_name"]],[this.componentProperties.source] : val}
     }else{
      this.tabWiseChangedData[tabName["tab_name"]] = {[this.componentProperties.source] : val}
     }

     this.valuesAndDepsStore.setmultiTabTabWiseChangeData(this.tabWiseChangedData);

       if (tabName && this.tabWiseData[tabName["tab_name"]]){

       }else if (tabName){
        if (this.tabWiseData){
          this.tabWiseData[tabName["tab_name"]] = {}
          this.tabWiseData[tabName["tab_name"]]["edited_fields"]=[]
        }else{
          this.tabWiseData={}
          this.tabWiseData[tabName["tab_name"]] = {}

          this.tabWiseData[tabName["tab_name"]]["edited_fields"]=[]
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

       if (tabName && this.tabWiseData[tabName["tab_name"]] && this.tabWiseData[tabName["tab_name"]].hasOwnProperty(this.componentProperties.source) ){
        this.tabWiseData[tabName["tab_name"]][this.componentProperties.source] = val
        this.valuesAndDepsStore.setTabWiseData(this.tabWiseData)
        let fieldsData = this.valuesAndDepsStore.getMultiInfo();
        let key = Object.keys(fieldsData)[0]
        if (fieldsData){
          fieldsData[key][tabName["tab_name"]] = this.tabWiseData[tabName["tab_name"]]

        }

        this.valuesAndDepsStore.setMultiInfo(fieldsData);
       }else{
        if (tabName && this.tabWiseData[tabName["tab_name"]]){
          this.tabWiseData[tabName["tab_name"]][this.componentProperties.source] = val
          this.valuesAndDepsStore.setTabWiseData(this.tabWiseData)
          let fieldsData = this.valuesAndDepsStore.getMultiInfo();
          let key = Object.keys(fieldsData)[0]
          if (fieldsData){
            fieldsData[key][tabName["tab_name"]] = this.tabWiseData[tabName["tab_name"]]

          }

          this.valuesAndDepsStore.setMultiInfo(fieldsData);

        }
       }


  }
  keyUpCheck(e): void {



   
    this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, e.target.value)
    if(e.target.value){
      this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, e.target.value)
      this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(e.target.value);
    }

    this.editedFields=this.valuesAndDepsStore.getEditedFields();
    if (this.editedFields.includes(this.componentProperties.source)){

    }else{
      this.editedFields.push(this.componentProperties.source);

    }

    this.valuesAndDepsStore.storeEditedFields(this.editedFields);
    this.valuesAndDepsStore.setComponentCommonDataProp("edited_fields",this.editedFields);
    this.valuesAndDepsStore.setComponentCommonDataProp("EDITED_FIELDS",this.editedFields);
    console.log(this.editedFields)

    if (this.componentProperties.disallowed_chars) {
    }


  }

  hasValueinEditedFields(){
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

check(){

  let list = this.valuesAndDepsStore.getGlobalList();
  let index =  list[this.valuesAndDepsStore.getCaseId()].indexOf(this.componentProperties.source);
  if (index !== -1) {

  }
  else{
    list[this.valuesAndDepsStore.getCaseId()].push(this.componentProperties.source)
  }
}


  getkeyPressed(){

    return this.keyclicked
  }

  store_value = ''
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

    this.hasValue()
    this.appendSuggestions = []
    this.store_value =  e.target.value
    if(this.store_value == ""){
      this.show_suggestions = false
    }



  }





  search(){
    if(this.store_value){
      this.show_suggestions = true
    }
    else{
      this.show_suggestions = false
    }
    this.callSuggestions(this.store_value)
  }


  filteredSuggestions = []
  callSuggestions(value){
    this.maskEvent.mask(this.randomId, 'Loading Client Names..')
    this.filteredSuggestions = []
    let selectedValue = value
    //console.log(selectedValue)
    const params = {}
    params["search_val"] = value
    params["flag"] = 'search'
    params["val_col"] = 'search_client_name'
    params["variables"] = this.componentProperties.variables
    this.dataService.getSuggestion(params).subscribe(resp => {
         //console.log(resp)
         this.maskEvent.unMask(this.randomId);
         if(resp.flag){
           this.maskEvent.unMask(this.randomId);
           this.appendSuggestions =  resp["search_results"]
           this.filteredSuggestions =  this.appendSuggestions
           if(this.filteredSuggestions.length == 0){
            this.show_suggestions = false
           }
           //console.log(this.filteredSuggestions)
           this.getSuggestions()
         }
     })
  }

  openDatePickerDialog() {
    const dialogRef = this.dialog.open(DatePickerDialogComponent, {
      width: '350px',  // Adjust the width as needed
      panelClass: 'custom-dialog-container'  // Add custom styling if needed
    });

    let selectedDateString= '';
            // After the dialog closes, update the input field with the selected date
    dialogRef.afterClosed().subscribe((result: Date | null) => {
      // if (result instanceof Date && !isNaN(result.getTime())) {
        if (result) {
          if (moment.isMoment(result)) {
            selectedDateString = this.formatDate(result.toDate()); // Convert Moment.js to Date and format
            selectedDateString = this.formatDateToDDMMYYYY(selectedDateString);
            this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(selectedDateString)
            this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, selectedDateString)
          } else if (result instanceof Date && !isNaN(result.getTime())) {
            this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(selectedDateString)
            this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, selectedDateString)

          } else {
            this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(selectedDateString)
            this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, selectedDateString)

          }
          if(!this.editedFields.includes(this.componentProperties.source)){
            this.editedFields.push(this.componentProperties.source);
            this.valuesAndDepsStore.setComponentCommonDataProp("edited_fields",this.editedFields);
            this.valuesAndDepsStore.setComponentCommonDataProp("EDITED_FIELDS",this.editedFields);
          }
          this.valuesAndDepsStore.pushFieldChanges(this.componentProperties.source);

        }
      // }
    });

  }

  removeOrdinalSuffix(dateString: string): string {
  let cleanedString = dateString.replace(/\bSept\b/gi, 'Sep');

  return cleanedString;
  }

    // Format the date to DD-MM-YYYY
    private formatDate(date: Date): string {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    formatDateToDDMMYYYY(inputDate: string): string | null {
      const parsedDate = moment(inputDate, this.dateFormats, true);  // Use strict parsing
    
      if (parsedDate.isValid()) {
        // Calculate the end of the month based on the parsedDate
        const endOfMonth = parsedDate.endOf('month');
        // Format the end of the month as 'DD-MM-YYYY'
        return endOfMonth.format('DD/MM/YYYY');
      }
    
      return null; // Return null if input doesn't match any format
    }


  add(){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '300px';
    dialogConfig.data = {
      text:this.text ,
      flag:true,
      currentValue:[this.componentProperties.formgroup.controls[this.componentProperties.source].value]
    };

    const dialogRef = this.dialog.open(DynamicAdacdComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if(result.flag){
          let new_values_list = result.acd.join(",");
          //console.log(this.componentProperties.formgroup.controls[this.componentProperties.source].value)
          this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(new_values_list);
        }
      }
    })

  }

  changeNumFormat(formField?:any){
    const value = this.valuesAndDepsStore.loadFromCommonData(this.componentProperties.source);
    const modified_value = this.convertToMillions(value);
    this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, modified_value)
    this.loadValue('onChange');

  }

  convertToMillions(numberStr:any){
    // Remove any existing commas from the input string
    numberStr = numberStr.replace(/[,\s]/g, '');

      // Check if the input string is a valid number
      if (!/^\d+$/.test(numberStr)) {
        throw new Error("Input string is not a valid number");
    }
  // Reverse the string to start from the units place
  const reversedNumber = numberStr.split('').reverse().join('');

  // Insert commas every 3 characters
  const chunks = [];
  for (let i = 0; i < reversedNumber.length; i += 3) {
      chunks.push(reversedNumber.slice(i, i + 3));
  }
  
  // Join the chunks with commas and reverse the string back
  const formattedNumber = chunks.join(',').split('').reverse().join('');
  
  return formattedNumber;
}

  ngOnDestroy(): void {
      this.valuesAndDepsStore.setCropClickedData({});
  }

}
