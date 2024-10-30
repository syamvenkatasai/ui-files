import { Component, OnInit, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { DynamicComponentsInterfaceComponent } from '../../dynamic-components';
import { ValuesAndDependencyStoreService } from 'src/app/field-exception/service/values-dependencies-store.service';
import { DataService } from 'src/app/core/services/serviceBridge/data.service';
import { AuthService } from 'src/app/core/services/global/authentication.service';
import { FormField } from 'src/app/core/model/dynamicForm/fields/form-field';
import { BusinessRuleService } from 'src/app/core/services/businessrules/businessrule.service';
import { ComponentStoreService } from 'src/app/core/services/component-store/component-store.service';
import { FieldProperties } from '../field-properties';
import { BizrulesService } from 'src/app/core/services/businessrules/bizrules.service';
import { DateAdapter } from '@angular/material/core';
import * as moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { debounceTime } from 'rxjs/operators';
import { MatDialog,MatDialogConfig } from '@angular/material/dialog';
import { GenerateSuggestionsPopupComponent } from '../../generate-suggestions-popup/generate-suggestions-popup.component';

var dateInput = 'DD-MM-YYYY';

export const MY_FORMATS = {
  parse: {
    dateInput: dateInput,
  },
  display: {
    dateInput: dateInput,
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export function getFormat() {
  return {
    parse: {
      dateInput: dateInput,
    },
    display: {
      dateInput: dateInput,
      monthYearLabel: 'MMM YYYY',
      dateA11yLabel: 'LL',
      monthYearA11yLabel: 'MMMM YYYY',
    }
  }
};

@Component({
  selector: 'app-dynamic-date-field',
  templateUrl: './dynamic-date-field.component.html',
  styleUrls: ['./dynamic-date-field.component.scss']
})
export class DynamicDateFieldComponent extends DynamicComponentsInterfaceComponent implements OnInit, OnDestroy {
  currentClass: any;
  constructor(private valuesAndDepsStore: ValuesAndDependencyStoreService,
    private authService: AuthService, private dataService: DataService, private dateAdapter: DateAdapter<Date>,
    private businessRuleService: BusinessRuleService, private compStore: ComponentStoreService, private rules: BizrulesService,private dialog:MatDialog) {
    super(compStore, valuesAndDepsStore)
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
    this.authService.classtoAddSubject.subscribe((value) =>
      this.currentClass = value
    )
  }



  comp_id
  bOrCon = 'view'
  builderProperties
  prop_sent = false;
  tabWiseData
  tabWiseChangedData
  tenant_id = ''
  updateValuesNextSub: any
  formFieldValueChangesSub: any
  patternFailureMsg:any
  initialLoad: any = true;
  @Input() set builderData(val) {
    this.comp_id = val.id;
    if (val && val.properties) {
      this.setProperties(val.properties)
    }
    if (val && val.builderOrConsumer) {
      if (this.bOrCon !== val.builderOrConsumer) {
        this.bOrCon = val.builderOrConsumer
        this.loadCompoenent()
        if (!this.prop_sent) {
          this.sendingProperties()
        }
      }
    }
  };
  @Output() sendProperties = new EventEmitter();

  sendingProperties() {
    this.sendProperties.emit({ properties: FieldProperties.date_field_component, id: this.comp_id });
    this.prop_sent = true
  }

  builderLabel: string
  requiredField: boolean
  fieldCheckbox: boolean
  fieldCrop: boolean

  text_color;
  font_size;
  font_weight;
  text_transform;
  modified_value
  editedFields: any = []
  updateFormValuesSub: any;
  valueChangesSub: any;

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
      MY_FORMATS.parse.dateInput = e.pattern;
      MY_FORMATS.display.dateInput = e.pattern; //'DD-MMM-YYYY';
    }
    else {
      MY_FORMATS.parse.dateInput = 'DD-MM-YYYY';
      MY_FORMATS.display.dateInput = 'DD-MM-YYYY';
    }

    this.builderProperties = e
  }

  loadCompoenent() {

  }

  validField = true
  // override ngOnInit() {

  //   if (this.bOrCon === 'builder') {

  //   } else {

  //     this.text_color = this.componentProperties['text_color'] || "#333333";
  //     this.font_size = (this.componentProperties['font_size'] * 0.06)+ 'em' || "12px";
  //     this.font_weight = this.componentProperties['font_weight'] || "normal"
  //     this.text_transform = this.componentProperties['text_transform'] || "initial"


  //     if(this.formField.datePattern) {
  //       MY_FORMATS.parse.dateInput = this.formField.datePattern;
  //       MY_FORMATS.display.dateInput = this.formField.datePattern; //'DD-MMM-YYYY';
  //     } else {
  //       MY_FORMATS.parse.dateInput = 'DD/MM/YYYY';
  //       MY_FORMATS.display.dateInput = 'DD/MM/YYYY';
  //     }
  //     this.loadValue('onload')
  //     this.runFieldLevelBusinessRule(this.componentProperties, 'onload')

  //     this.authService.updateFormValues.subscribe(value => {
  //       this.updateValueFromResponse(value)
  //     });

  //     this.authService.invalidFieldCheck.subscribe(value => {
  //       let field_form = this.componentProperties.formgroup.get(this.componentProperties.source)
  //       if (field_form && field_form.status === 'INVALID') {
  //         this.validField = false
  //       }
  //       else {
  //         this.validField = true
  //       }
  //     })
  //   }
  // }
  override ngOnInit() {
    this.tenant_id = this.authService.getTenantId()
    this.tabWiseData = this.valuesAndDepsStore.getTabWiseData();
    this.tabWiseChangedData = this.valuesAndDepsStore.getmultiTabTabWiseChangeData();
    if (this.bOrCon === 'builder') {
      // Handle builder mode if needed
    } else {
      // Load styling properties
      this.initialLoad = true;
      this.text_color = this.componentProperties['text_color'] || "#333333";
      this.font_size = (this.componentProperties['font_size'] * 0.06) + 'em' || "12px";
      this.font_weight = this.componentProperties['font_weight'] || "normal";
      this.text_transform = this.componentProperties['text_transform'] || "initial";
      this.patternFailureMsg = this.componentProperties["pattern_failure_message"];
      this.loadValue('onload')
      // Initialize MY_FORMATS based on formField.datePattern or default
      this.editedFields = this.valuesAndDepsStore.loadFromCommonData("EDITED_FIELDS");
      if (typeof this.editedFields === "string") {
        this.editedFields = JSON.parse(this.editedFields)
      }
      if (this.editedFields && this.editedFields.length > 0) {
        // this.editedFields=JSON.parse(this.editedFields);
        this.valuesAndDepsStore.storeEditedFields(this.editedFields);
      } else {
        this.editedFields = [];
      }
      if (this.formField.datePattern) {
        MY_FORMATS.parse.dateInput = this.formField.datePattern;
        MY_FORMATS.display.dateInput = this.formField.datePattern;
      } else {
        MY_FORMATS.parse.dateInput = 'DD/MM/YYYY';
        MY_FORMATS.display.dateInput = 'DD/MM/YYYY';
      }

      // Load initial value for selectionValue
      const controlValue = this.componentProperties.formgroup.controls[this.componentProperties.source].value;
      this.selectionValue = this.convertStringToDate(controlValue);
      // this.loadValue("onload")

      // Subscribe to form control value changes to update selectionValue
      // this.formFieldValueChangesSub = this.componentProperties.formgroup.controls[this.componentProperties.source].valueChanges.subscribe(value => {
      //   const modifiedValue = this.sanitizeValue(value);
      //   this.selectionValue = this.convertStringToDate(modifiedValue);
      //   console.log(this.selectionValue);
      // });

      this.valueChangesSub = this.componentProperties.formgroup.controls[this.componentProperties.source].valueChanges
        .pipe(debounceTime(300))  // Adjust debounce time as needed
        .subscribe(value => {
          if (this.initialLoad) {
            this.initialLoad = false;
            return;
          }
          const modifiedValue = this.sanitizeValue(value);
          this.selectionValue = this.convertStringToDate(modifiedValue);
          console.log(this.selectionValue);
        });

      // Subscribe to updates in form values
      this.updateFormValuesSub = this.authService.updateFormValues.subscribe(value => {
        if (value && value.hasOwnProperty(this.componentProperties.source)) {
          this.updateValueFromResponse(value);
        }

      });
      this.updateValuesNextSub = this.valuesAndDepsStore.updateValuesNext.subscribe(data => {


        if (data && data.source_name === this.componentProperties.source) {


          this.componentProperties.value = data.value
          this.modified_value = data.value
          this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(data.value);
          this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, data.value)
          const control = this.componentProperties.formgroup.controls[this.componentProperties.source];

          // Step 2: Unsubscribe when you need to stop listening to value changes
          this.valueChangesSub.unsubscribe();
          control.setValue(data.value);  // Set the value 
          // You can later resubscribe if needed
          this.valueChangesSub.add(
            this.componentProperties.formgroup.controls[this.componentProperties.source].valueChanges.subscribe(value => {
              const modifiedValue = this.sanitizeValue(value);
              this.selectionValue = this.convertStringToDate(modifiedValue);
              console.log(this.selectionValue);
            })
          )
          control.setValue(data.value);  // Set the value 

               
          this.valuesAndDepsStore.storeEditedFields(this.editedFields);
          const modifiedValue = this.sanitizeValue(data.value);
          this.selectionValue = this.convertStringToDate(modifiedValue);
          console.log(this.selectionValue)
          if (this.modified_value) {
            this.keyclicked = true
            this.check();
          }
          else {
            this.keyclicked = false
          }
          this.getkeyPressed()
          this.valuesAndDepsStore.setCropClickedData({});
          this.cropClickedData = this.valuesAndDepsStore.getCropClickedData();
          this.editedFields = this.valuesAndDepsStore.getEditedFields();

          if (!this.editedFields.includes(this.componentProperties.source)) {
            this.editedFields.push(this.componentProperties.source);
          }

          this.fieldChanged("");
          this.runFieldLevelBusinessRule(this.componentProperties, 'onchange')
        }
      })

      // Subscribe to check for invalid fields
      this.authService.invalidFieldCheck.subscribe(value => {
        const field_form = this.componentProperties.formgroup.get(this.componentProperties.source);
        this.validField = field_form && field_form.status !== 'INVALID';
      });
    }
  }

  override checkDependencyTypeandExecute(dependencyName) {
    switch (dependencyName) {
      case "load_component":
        this.loadValue('onchange')
        break;
    }
  }

  selectionValue: Date | null = null;

  // Converting string to Date object
  // convertStringToDate(value: string): Date | null {
  //   return moment(value, MY_FORMATS.parse.dateInput).toDate();
  // }

  removeOrdinalSuffix(dateString: string): string {
    // return dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
      // Replace ordinal suffixes (st, nd, rd, th) from the day part
  // let cleanedString = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');

  let cleanedString = dateString.replace(/\bSept\b/gi, 'Sep');

  return cleanedString;
  }

  convertStringToDate(value: string): Date | null {
    const dateFormats = [
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
      'DD/MMM/YYYY',   // '30/Oct/2023'
      'MMMM D, YYYY' ,  // 'December 31, 2023'
      'MMM YYYY',  //'Sep 2023'
      'Do MMM, YYYY', //'30th Sep, 2024'
      'Do MMM,YYYY', //'30th Sep, 2024',
      'MMMM D, YYYY',   // 'October 31, 2023'
      'MMMM D,YYYY',   // 'October 31, 2023'
      'Do MMMM-YYYY',   // '31st OCTOBER-2023'
      'DD /MM/YYYY',   // '31 /08/2023'
      'DD-MMM-YYYY',   // '20-Jun-2024'
      'DD MM YYYY',   // '11 11 2023'
      'D [st|nd|rd|th] MMM YY', //1st Jan 24
      'D MMM YY',   // '1 Jan 14'
      'D-MMMM-YY',  //1-sept-24
      'D-MMMM-YY',  //1-sept-24
      'D-MMM-YY',
      'DD-MMM-YY'

    ];


    if (moment(value, 'MMM-YY', true).isValid()) {
      const parsedDate = moment(value, 'MMM-YY', true).endOf('month');
      return parsedDate.toDate();
    }
    // Special handling for 'MMMM YYYY' format to get the end of the month
    if (moment(value, 'MMMM YYYY', true).isValid()) {
      const parsedDate = moment(value, 'MMMM YYYY', true).endOf('month');
      return parsedDate.toDate();
    }
    if (moment(value, 'MMM YYYY', true).isValid()) {
      const parsedDate = moment(value, 'MMM YYYY', true).endOf('month');
      return parsedDate.toDate();
    }
    if (moment(value, 'MMMM YY', true).isValid()) {
      const month = value.split(' ')[0].slice(0, 3); // Get first three letters of the month
      const year = value.split(' ')[1];
      const shortenedValue = `${month}-${year}`;
      if (moment(shortenedValue, 'MMM-YY', true).isValid()) {
        const parsedDate = moment(shortenedValue, 'MMM-YY', true).endOf('month');
        return parsedDate.toDate();
      }
    }

    const cleanedValue = this.removeOrdinalSuffix(value);
    const parsedDate = moment(cleanedValue, dateFormats, true);
    // const parsedDate = moment(value, dateFormats, true);
    if (parsedDate.isValid()) {
      const formattedDate = parsedDate.format('DD/MM/YY');
      return moment(formattedDate, 'DD/MM/YY').toDate();
    } else {
      return null;
    }
  }








  sanitizeValue(value: string): string {
    if (!value) return '';

    // Remove any suspicious content from the value
    // let sanitizedValue = value.replace(/suspicious/g, '');
    // sanitizedValue = sanitizedValue.replace(/SUSPICIOUS/g, '');

    return value;
  }

  loadValue(event) {
    const value = this.valuesAndDepsStore.loadFromCommonData(this.componentProperties.source);
    if (value) {
      const modifiedValue = this.sanitizeValue(value);
      this.selectionValue = this.convertStringToDate(modifiedValue);
      this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(this.selectionValue);
      this.runFieldLevelBusinessRule(this.componentProperties, event);
    } else {
      this.getValue(event);
    }
  }

  hasValueinEditedFields() {

    this.editedFields = this.valuesAndDepsStore.getEditedFields();
    // console.log(this.editedFields)
    if (this.editedFields && this.editedFields.length > 0 && this.editedFields.includes(this.componentProperties.source)) {
      return true;
    }
    return false;

  }


  hasValue() {


    let val = this.componentProperties.formgroup.controls[this.componentProperties.source].value


    // if(this.keyclicked == true){
    //   return false
    // }
    // else{

    if (this.authService.getTenantId() !== 'ambankdisbursement') {
      let list = this.valuesAndDepsStore.getGlobalList()
      let flag = true
      // const date = moment(val, 'ddd MMM DD YYYY HH:mm:ss [GMT]Z (zz)').toDate();
      if(val){
        const date = new Date(val);
        if ((val && Object.keys(val).length > 0) || (typeof val == "string" && val.length > 0)) {
  
  
          return flag
        } else if (date) {
          // let date1 = new Date(val);
          if (isNaN(date.getTime())) {
            return false
          } else {
  
          }
  
          return flag;
        }
      }

      else {
        if (val && Object.keys(val).length > 0) {
          return true
        }
        else {
          return false
        }
      }
      // }


    }
    return false;


  }

  // loadValue(event) {
  //   const value = this.valuesAndDepsStore.loadFromCommonData(this.componentProperties.source);
  //   if (value) {
  //     let modified_value = ""
  //     try {
  //       modified_value = value.replace(/suspicious/g, '')
  //       modified_value = value.replace(/SUSPICIOUS/g, '')
  //     } catch (error) {
  //       modified_value = String(value)
  //     }
  //     this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(modified_value);
  //     this.runFieldLevelBusinessRule(this.componentProperties, event)
  //   } else {
  //     this.getValue(event)
  //   }
  // }
  getValue(event) {
    const params: any = {
      component_unique_name: this.componentProperties.unique_name,
      field_unique_name: this.componentProperties.source,
      queue_id: this.authService.getSelectedQueueId(),
      case_id: this.valuesAndDepsStore.getCaseId(),
      url: this.componentProperties.url
    }
    if (this.componentProperties.params) {
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
    this.dataService.getFieldValue(params).subscribe(resp => {
      try {
        if (resp && resp.data) {
          this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, resp.data[this.componentProperties.source])
          let value = resp.data[this.componentProperties.source];
          this.selectionValue = resp.data[this.componentProperties.source];
          this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(value);
          this.runFieldLevelBusinessRule(this.componentProperties, event)
        }
        else {
          console.log('response data is not available')
        }
      } catch (error) {
        console.error('An error occurred while processing the response data:', error);
      }
    })
  }

  updateValueFromResponse(resp) {
    this.valuesAndDepsStore.setComponentCommonDataProp(this.componentProperties.source, resp[this.componentProperties.source])

    let value = resp[this.componentProperties.source];
    this.selectionValue = this.convertStringToDate(value);
    // this.selectionValue = this.convertStringToDate(modifiedValue);
    this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(this.selectionValue);
    // this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(value);
    this.runFieldLevelBusinessRule(this.componentProperties, 'onchange')
  }
  keyclicked = false

  check() {

    let list = this.valuesAndDepsStore.getGlobalList();
    let index = list[this.valuesAndDepsStore.getCaseId()].indexOf(this.componentProperties.source);
    if (index !== -1) {

    }
    else {
      list[this.valuesAndDepsStore.getCaseId()].push(this.componentProperties.source)
    }
  }


  getkeyPressed() {

    return this.keyclicked
  }



  // fieldChanged(e) {
  //   this.componentProperties.formgroup.controls[this.componentProperties.source].value=this.selectionValue
  //   this.valuesAndDepsStore.pushFieldChanges(this.componentProperties.source)
  // }
  fieldChanged(event) {
    // this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(event.value);
    this.valuesAndDepsStore.pushFieldChanges(this.componentProperties.source);
    this.editedFields = this.valuesAndDepsStore.getEditedFields();

    if (this.editedFields.includes(this.componentProperties.source)) {

    } else {
      this.editedFields.push(this.componentProperties.source);

    }
    this.valuesAndDepsStore.setComponentCommonDataProp("edited_fields", this.editedFields);
    this.valuesAndDepsStore.setComponentCommonDataProp("EDITED_FIELDS", this.editedFields)
  }

  override checkForFocus() {
    if (this.formField) {
      // this.formField.fieldToBeCropped.subscribe(value => {
      //   this.fieldToBeChanged(value);
      // });

      // this.formField.fieldOnFocus.subscribe(value => {
      //   this.fieldOnFocus(value);
      // });

      // this.componentProperties.formgroup.controls[this.formField.source].valueChanges.subscribe(value => {
      //   this.runFieldLevelBusinessRule(this.formField);
      // })
    }
  }

  // runFieldLevelBusinessRule(formField?: FormField) {
  //   if(formField.biz_rules) {
  //     const evaluatedRules = this.businessRuleService.runFieldLevelBusinessRules(formField, this.componentProperties.formgroup);
  //     this.executeRules(evaluatedRules);
  //   }
  // }

  getMaxDate() {
    return this.componentProperties.block_future_date ? new Date() : null
  }
  getMinDate() {
    return this.componentProperties.block_past_date ? new Date() : null
  }


  override runFieldLevelBusinessRule(formField, event_type?: any) {
    // if(formField.biz_rules) {
    //   const evaluatedRules = this.businessRuleService.runFieldLevelBusinessRules(formField, this.componentProperties.formgroup);
    //   this.executeRules(evaluatedRules);
    // }

    if (formField.rules_list && formField.rules_list.length > 0) {
      this.rules.evaluateRules(formField, event_type)
    }
  }
  uniqueName
  cropFieldClicked2(form) {
    this.uniqueName = form.source;
    this.valuesAndDepsStore.setUniqueName(this.uniqueName)

  }

  openSuggestions(suggestions){
    const dialogConfig = new MatDialogConfig();
        suggestions = JSON.parse(suggestions)
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.maxHeight = 'calc(100vh - 75px)';
        dialogConfig.width = '35%';
        dialogConfig.maxWidth = '90vw'
        dialogConfig.data = suggestions
        if (suggestions && suggestions["header"] && suggestions["formats"]){
          const dialogRef = this.dialog.open(GenerateSuggestionsPopupComponent, dialogConfig);
 
        }
 
  }

  ngOnDestroy(): void {
    if (this.updateValuesNextSub) {
      this.updateValuesNextSub.unsubscribe();
    }
    if (this.formFieldValueChangesSub) {
      this.formFieldValueChangesSub.unsubscribe();
    }
    if (this.updateFormValuesSub) {
      this.updateFormValuesSub.unsubscribe();
    }
  }
}
