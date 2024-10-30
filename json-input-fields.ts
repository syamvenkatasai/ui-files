import { SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BuilderConfigurationService } from 'src/app/core/services/builder-configuration.service';
import { ComponentStoreService } from 'src/app/core/services/component-store/component-store.service';
import { AuthService } from 'src/app/core/services/global/authentication.service';
import { MaskEventService } from 'src/app/core/services/mask-event.service';
import { DataService } from 'src/app/core/services/serviceBridge/data.service';
import { ValuesAndDependencyStoreService } from 'src/app/field-exception/service/values-dependencies-store.service';
import { DynamicComponentsInterfaceComponent } from '../dynamic-components';
import { QueueListProperties } from './queueListProperties';
import { StatusService } from 'src/app/core/services/statusmessage/status.service';
import { BizrulesService } from 'src/app/core/services/businessrules/bizrules.service';
import { GenerateDynamicPopupComponent } from '../generate-dynamic-popup/generate-dynamic-popup.component';
import { FormControl } from '@angular/forms';
import { DynamicPopupService } from '../generate-dynamic-popup/dynamic-popup.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import * as moment from 'moment';
import { BuilderStoreService } from 'src/app/core/services/serviceBridge/builder-store.service';
import { forEach } from 'jszip';
import { JsonInputFieldsPopupComponent } from './json-input-fields-popup/json-input-fields-popup.component';
import { DeleteFieldPopupComponent } from './delete-field-popup/delete-field-popup.component';
import { CallbackPopupComponent } from 'src/app/field-exception/callback-popup/callback-popup.component';

declare var $: any;


@Component({
  selector: 'app-generate-json-input-fields',
  templateUrl: './generate-json-input-fields.component.html',
  styleUrls: ['./generate-json-input-fields.component.scss']
})

export class GenerateJsonInputFieldsComponent extends DynamicComponentsInterfaceComponent implements OnInit, OnDestroy {
  displayedColumns: string[]
  columnMap: any = {};
  dataSource = []
  pathId = '';
  @ViewChild(MatSort) sort: MatSort;
  paginatorData = {};
  currentPageNumber = 1;
  numberofRecordsPerPage = 20;
  max = 100;
  stroke = 6;
  radius = 20;
  caseId = "";
  fileSelected = false;
  formPageHidden = false;
  headerContextTrainedFields:any = {};
  //pdfType = '';
  sortedData = [];
  dataFromPopUp;

  request_url: string
  comp_id
  bOrCon = 'view';
  prop_sent = false;
  tenant_id;
  columnFilterInput = [];
  receiveProps;
  previousIndex: number;
  showSearch: boolean;
  showPagination: boolean;
  numberOfFilesPerPage;
  subscriptionStatusKeys:any = [];
  deleteFields: any = this.valuesAndDependenciesStore.getGlobalList2()
  caseId1 = this.valuesAndDependenciesStore.getCaseId()

  header_font_size
  row_font_size
  row_size;
  pagination_font
  unitsList: any;
  currentCroppingFieldData: any;

  @ViewChild('table') table: MatTable<Element>;
  @Output() sendProperties = new EventEmitter();
  styleObject: any;
  selection = new SelectionModel<any>(true, []);
  storeColumnMapping = [];
  columnData = {};
  filterArray = [];
  filter_data: any = { "column_order": "", "column_name": "", "sort_order": "", "data_type": "" };
  resetFilteredData: boolean = false;
  filterText = ""
  filterApplied = false;
  additionalColumns = new FormControl();
  allColumns: string[] = [];
  searchFilters = {}
  keyclickedMap: { [key: string]: boolean } = {};
  disable = false


  @Input()
  set builderData(val) {

    //// console.log(val)
    // if (JSON.stringify(val) !== JSON.stringify(this.receiveProps)) {
    this.comp_id = val.id;
    this.receiveProps = val;
    if (this.receiveProps && this.receiveProps.properties) {
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
    // }
  };

  startFile;
  endFile;
  panelOpenState = false;
  currentClass: any;
  isChecked = false;
  constructor(
    private dynamicPopServ: DynamicPopupService,
    private dataService: DataService, private maskEvent: MaskEventService,
    private router: Router, private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private authService: AuthService, private valuesAndDependenciesStore: ValuesAndDependencyStoreService,
    private compStore: ComponentStoreService, private elem: ElementRef,
    private buliderConfiguration: BuilderConfigurationService, private statusService: StatusService,
    private rules: BizrulesService, private dialog: MatDialog, private builderStore: BuilderStoreService,) {
    super(compStore, valuesAndDependenciesStore);
    //this.buliderConfiguration.setScreenProperties(builderProps);
    this.authService.classtoAddSubject.subscribe((value) =>
      this.currentClass = value
    )
  }

  callJsonCrop: any;
  randomId = ""
  pageHeading = ""
  updatePreviewSub: any;
  view_card: any
  editedFields: any;
  dropdowns_data: any;
  keyclislist = {};
  deleteFieldsArray = [];
  override ngOnInit() {

    this.disable = this.componentProperties["disable_all"]
    this.deleteFields = this.valuesAndDependenciesStore.getGlobalList2()
    this.caseId = this.valuesAndDependenciesStore.getCaseId();
    this.deleteFieldsArray = this.deleteFields[this.caseId]
    this.headerContextTrainedFields = {...this.valuesAndDependenciesStore.trainedHighLightFields[this.caseId]};
    this.headerContextTrainedFields = Object.keys(this.headerContextTrainedFields) || [];
    this.currentCroppingFieldData = this.valuesAndDependenciesStore.getCropClickedData();
    try{
      this.subscriptionStatusKeys = JSON.parse(this.valuesAndDependenciesStore.loadFromCommonData("unsubscribed_fields"));
    }catch(e){
      this.subscriptionStatusKeys = this.valuesAndDependenciesStore.loadFromCommonData("unsubscribed_fields") || [];
    }
    this.editedFields = this.valuesAndDependenciesStore.loadFromCommonData("edited_fields")
    this.isChecked = false
    if (typeof this.editedFields === "string") {
      this.editedFields = JSON.parse(this.editedFields)
    }
    if (this.editedFields && this.editedFields.length > 0) {
      this.valuesAndDependenciesStore.storeEditedFields(this.editedFields);
    } else {
      this.editedFields = [];
    }

    this.selectedUnit = "Rupees"
    this.unitsList = this.valuesAndDependenciesStore.loadFromCommonData("selected_units")
    if (this.unitsList) {
      try {
        this.unitsList = JSON.parse(this.unitsList);
      } catch (er) {

      }

      this.valuesAndDependenciesStore.storeSelectedUnitsObj(this.unitsList);
    }
   

    for (let tab_id in this.valuesAndDependenciesStore.convertableData) {
      let tab = this.valuesAndDependenciesStore.convertableData[tab_id]; // Access the object using the key
      if (tab["source"].includes(this.componentProperties.source)) {
        this.selectedUnitsValue = tab["selected_units"];
        this.oldValue = this.selectedUnitsValue;
        this.isChecked = tab["isChecked"];
        break;
      }
    }
    

    this.authService.classtoAddSubject.next(this.authService.getCurrentTheme());
    this.randomId = this.authService.randomID(8)
    if (this.bOrCon != 'builder' && this.bOrCon == 'view') {
      this.pageHeading = this.componentProperties['display_name'] || ""
      this.tenant_id = this.authService.getTenantId();
      this.view_card = this.componentProperties['viewascard'] || false
      this.header_font_size = this.componentProperties['header_font_size'] + 'px' || "14px"
      this.row_font_size = this.componentProperties['row_font_size'] + 'px' || "14px"
      this.row_size = this.componentProperties['row_size'] + 'px' || "36px"
      this.pagination_font = this.componentProperties['pagination_font'] + 'px' || "13px"

      this.loadCompoenent()


      this.callJsonCrop = this.authService.updateCroppedValueForInputValue.subscribe(x => {
        console.log(x.obj);
        if(!this.restrictValue(x.obj)){
          this.openErrorDialog();
        }
        let i = 0
        let newValueUpdateObj = x.obj;
        let allFieldsInfo = this.feldsInfo;

        for (const key in this.feldsInfo) {
          i = i + 1

          if (newValueUpdateObj.hasOwnProperty(key)) {
            if (this.isObject(this.feldsInfo[key])) {


              if (this.feldsInfo[key]['a.v'][this.selectedValues[i - 1].subKey]) {
                try{
                  allFieldsInfo[key]['a.v'][this.selectedValues[i - 1].subKey] = newValueUpdateObj[key];
                }catch(e){

                }
              }
              this.selectedValues[i - 1].value = newValueUpdateObj[key];
              this.feldsInfo = JSON.parse(JSON.stringify(allFieldsInfo));
            }

            else {
              allFieldsInfo[key] = JSON.parse(JSON.stringify(newValueUpdateObj[key]));
              this.feldsInfo = JSON.parse(JSON.stringify(allFieldsInfo));
            }

            // Update keyclicked status only for the keys that are cropped
            this.keyclickedMap[key] = true;
            this.keyclislist[key] = true;
            this.hasValue(newValueUpdateObj[key], key);

            this.editedFields = this.valuesAndDependenciesStore.getEditedFields();

            if (!this.editedFields.includes(key)) {
              this.editedFields.push(key);
            }

            this.valuesAndDependenciesStore.storeEditedFields(this.editedFields);
            this.selectionChangeEvent(key, "Cropped", newValueUpdateObj[key], i - 1)
            let componentCommonData = this.valuesAndDependenciesStore.getComponents()
            let unique_name_1 = "edited_fields".toUpperCase()
            if (componentCommonData && componentCommonData[unique_name_1]) {
              componentCommonData[unique_name_1] = this.editedFields
            } else {
              componentCommonData[unique_name_1] = this.editedFields

            }


            let field_name = this.componentProperties.source.toUpperCase()
            if (componentCommonData && componentCommonData[field_name]) {
              componentCommonData[field_name] = JSON.stringify(this.feldsInfo)
            } else {
              componentCommonData[field_name] = JSON.stringify(this.feldsInfo)

            }

            this.valuesAndDependenciesStore.setComponentCommonData(componentCommonData)

          } else {
            // If the key is not in the cropped data, update its status accordingly
            if (!this.keyclislist[key]) {
              this.keyclickedMap[key] = false;
              this.keyclislist[key] = false;
            }
          }

          this.getkeyPressed(key);
          this.sendBack();
          this.valuesAndDependenciesStore.setCropClickedData({});
          this.currentCroppingFieldData = this.valuesAndDependenciesStore.getCropClickedData();
        }
      });


      this.authService.updateJsonFields.subscribe(x => {

        for (let tab_id in this.valuesAndDependenciesStore.convertableData) {
          let data = this.valuesAndDependenciesStore.convertableData[tab_id];
          if (data["source"].includes(this.componentProperties.source)) {
            this.selectedUnitsValue = data["selected_units"];
            this.oldValue = this.selectedUnitsValue;
            this.isChecked = data["isChecked"];
            break;
          }
        }
       
        this.loadCompoenent();
        this.initializeSelectedValues();
      })

    }
    else {

    }
    this.initializeSelectedValues()
    this.authService.updateFormValues.subscribe(value => {
      this.headerContextTrainedFields = {...this.valuesAndDependenciesStore.trainedHighLightFields[this.caseId]};
      this.headerContextTrainedFields = Object.keys(this.headerContextTrainedFields) || [];
      this.loadCompoenent()
      this.initializeSelectedValues()
    });
  }

  editedValues = []

  keyUpCheck(e, key, value, newValue, index,isUnsubscribed: boolean = false) {
    console.log(this.feldsInfo[key])
    if (!this.feldsInfo[key]) {
      this.editedValues.push("")
    }
    this.editedValues.push(newValue)
    let list = this.valuesAndDependenciesStore.getGlobalList1();
    let caseId = this.valuesAndDependenciesStore.getCaseId();
    this.editedFields = this.valuesAndDependenciesStore.getEditedFields();
    if (this.editedFields.includes(key)) {
      let index = this.editedFields.indexOf(key);

      if (value === "") {
        // Remove the key from the editedFields array
        this.editedFields.splice(index, 1);
        this.editedValues.push("")
      }

    } else {
      this.editedFields.push(key);

    }

    this.valuesAndDependenciesStore.storeEditedFields(this.editedFields);
    this.valuesAndDependenciesStore.setComponentCommonDataProp("edited_fields",this.editedFields);
    this.valuesAndDependenciesStore.setComponentCommonDataProp("EDITED_FIELDS",this.editedFields);

    if (e.keyCode !== 9) {
      if (e.target.value) {
        this.keyclickedMap[key] = true;
        let index = list[this.valuesAndDependenciesStore.getCaseId()].indexOf(key);
        if (index !== -1) {

        }
        else {
          list[this.valuesAndDependenciesStore.getCaseId()].push(key)
        }


      } else {
        this.keyclickedMap[key] = false;
      }
      this.getkeyPressed(key);
    }

    if (e.target.value === '') {
      if (list.hasOwnProperty(caseId)) {
        // Remove the key from the data structure
        let index = list[caseId].indexOf(key);

        if (index !== -1) {
          // Remove the element at the found index
          list[caseId].splice(index, 1);
        }

      }
    }
    this.valuesAndDependenciesStore.storeGlobalList1(list)
    if (this.editedValues.includes("")) {
      this.selectionChangeEvent(key, "Typed", newValue, index,isUnsubscribed)

    }
    else {
      this.selectionChangeEvent(key, this.selectedValues[index].subKey, newValue, index,isUnsubscribed)

    }
    this.editedValues = []
  }


  keyDownCheck(e, key) {
    if (e.keyCode !== 9) {
      if (e.target.value) {
        this.keyclickedMap[key] = true;
      } else {
        this.keyclickedMap[key] = false;
      }
      this.getkeyPressed(key);
    }
  }

  hasValueinEditedFields(key) {
    if (this.editedFields && this.editedFields.length > 0 && this.editedFields.includes(key)) {
      return true;
    }
    return false;

  }

  restrictNonNumeric(event: KeyboardEvent) {
    const allowedChars = /[0-9.,]/;
    const inputChar = String.fromCharCode(event.keyCode);
  
    if (!allowedChars.test(inputChar)) {
      event.preventDefault();
    }
  }

  restrictValue(obj:any){
    const key = Object.keys(obj)[0];

// Access the value of the first key
    const value = obj[key];
    const pattern = /^[0-9.,]*$/;
    return this.isValid(value,pattern)
    
  }
  
  isValid(value: string,pattern:any): boolean {
    return pattern.test(value);
  }


  getfeldsInfo() {
    return this.feldsInfo
  }


  Headers = []
  dropdownOptions = ['Option 1', 'Option 2', 'Option 3'];
  rowData = []
  setProperties(e) {

    this.dropdowns_data = this.builderStore.common_dropdowns.br_comparison_rules
    this.pageHeading = e.text || ""
    this.header_font_size = e.header_font_size + 'px' || "14px"
    this.row_font_size = e.row_font_size + 'px' || "14px"
    this.row_size = e.row_size + 'px' || "36px";
    this.pagination_font = e.pagination_font + 'px' || "13px";
    let pagination = {
      "end": Number(e.files_count),
      "start": 1,
      "total": 6
    };
    if (e && e.files_count) {
      this.numberOfFilesPerPage = e.files_count;
      this.paginatorData = pagination;
    }
    else {
      this.numberOfFilesPerPage = 20;
      this.startFile = 1;
      this.endFile = this.numberOfFilesPerPage;
    }

    // url
    if (e && e.url) {
      this.request_url = e.url
    }
    else {
      this.request_url = 'get_queue'
    }
    if (e && e.header_name) {
      this.Headers = []
      for (let i = 0; i < e.header_name.length; i++) {
        this.Headers.push(e.header_name[i].field.replace(" ", "_").toLowerCase())
      }
      this.displayedColumns = this.Headers
    }


    if (e && e.new_table) {
    }


  }

  tableData;
  headersInfo
  updatedTable: any;
  dynamic_json = {
    "date": "ag_ss_as_on_date",
    "stockstatementtotalamountinrs": "ag_total_stock",
    "stockstatementtotalamount": "ag_total_stock",
    "stockstatementtotal": "ag_total_stock",
    "stockstatementtotalamountrs": "ag_total_stock",
    "stockstatementtotalfreestockamountrs": "ag_total_stock",
    "creditorstotalvalueamountin": "ag_total_creditors",
    "creditorstotalvalueamountinrs": "ag_total_creditors",
    "creditorstotalvalueamount": "ag_total_creditors",
    "creditorstotalamountinrs": "ag_total_creditors",
    "creditorstotalrsincr": "ag_total_creditors",
    "creditorstotal": "ag_total_creditors",
    "creditorstotals": "ag_total_creditors"
  }
  feldsInfo = {};
  selectedUnit
  oldValue;
  dummyTableData = {
    header: ["fieldName", "value", "aging", "margin"],
    rowData: [
      { "fieldName": "", "value": "", "aging": "", "margin": "" },
    ]
  };
  displayedTableColumns;
  tableDataSource;
  loadCompoenent() {

    if (this.bOrCon == 'builder') {
      // this.feldsInfo = {
      //   "date":"ag_ss_as_on_date",
      //   "stockstatementtotalamountinrs":"ag_total_stock"
      // }
    }
    else {
      this.editedFields = this.valuesAndDependenciesStore.loadFromCommonData("edited_fields")
      if (typeof this.editedFields === "string") {
        this.editedFields = JSON.parse(this.editedFields)
      }
      if (this.editedFields && this.editedFields.length > 0) {
        this.valuesAndDependenciesStore.storeEditedFields(this.editedFields);
      } else {
        this.editedFields = [];
      }

      let value = this.valuesAndDependenciesStore.loadFromCommonData(this.componentProperties.source)
      if (value) {
        if (value && value.toLowerCase().indexOf("no data") == -1) {
          this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(value);
          value = value.replace(/\n/g, '\\n');
          this.updatedTable = JSON.parse(value || "{}");
          this.feldsInfo = this.updatedTable;
          console.log(this.feldsInfo)
          if (this.feldsInfo["tab_view"]) {
            // Update tableData with fieldsInfo[`${this.componentProperties.source}_table`]
            this.tableData = this.feldsInfo["tab_view"];
            // Remove `${this.componentProperties.source}_table` from fieldsInfo
          }
          else {
            this.tableData = this.dummyTableData
          }
          console.log(this.feldsInfo)
          // Exclude 'formula' column
          this.displayedTableColumns = this.tableData.header.filter(column => column !== 'formula');
          this.tableDataSource = this.tableData.rowData


        } else {

        }
      }

    }
  }
  getrowdata() {
    return this.rowData;
  }
  sendingProperties() {
    this.sendProperties.emit({ properties: QueueListProperties, id: this.comp_id });
    this.prop_sent = true
  }


  changedValue(e, item, index?) {
    if (this.isObject(this.feldsInfo[item.key])) {


      if (this.feldsInfo[item.key]['a.v'][this.selectedValues[index].key]) {
        this.feldsInfo[item.key]['a.v'][this.selectedValues[index].key] = e.target.value

      }
      if (this.feldsInfo[item.key]['r.v'][this.selectedValues[index].key]) {
        this.feldsInfo[item.key]['r.v'][this.selectedValues[index].key] = e.target.value
      }
      this.selectedValues[index].value = e.target.value

    }
    else {
      this.feldsInfo[item.key] = e.target.value
    }

    this.valuesAndDependenciesStore.setComponentCommonDataProp(this.componentProperties.source, JSON.stringify(this.feldsInfo))

    this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(JSON.stringify(this.feldsInfo));
  }
  removeCircularReferences(obj) {
    const seen = new WeakSet();

    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return; // Omit circular reference
        }
        seen.add(value);
      }
      return value;
    }));
  }

  // Example usage


  sendBack() {
    this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(JSON.stringify(this.feldsInfo));
    this.valuesAndDependenciesStore.setComponentCommonDataProp(this.componentProperties.source, JSON.stringify(this.feldsInfo))

    this.valuesAndDependenciesStore.pushFieldChanges(this.componentProperties.source)

  }


  checkEmpty() {
    if (this.feldsInfo) {
      if (Object.keys(this.feldsInfo).length === 0) {
        return true
      }
      else {
        return false
      }
    }
    else {
      return true
    }
  }
  openChildPopup(): void {
    const dialogRef = this.dialog.open(JsonInputFieldsPopupComponent, {
      width: '400px', // Set the dialog width as per your needs
      position: { right: '0px' }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
      this.dataFromPopUp = result;
      const keyToCheckExists = Object.keys(this.feldsInfo).includes(Object.keys(result)[0]);

      if (keyToCheckExists) {
        this.snackBar.open('Key already exists in the table.', 'Close', {
          duration: 3000, // Set the duration for the snackbar
        });
      } else {
        let caseId = this.valuesAndDependenciesStore.getCaseId();
        let list = this.valuesAndDependenciesStore.getGlobalList1();

        let index = list[this.valuesAndDependenciesStore.getCaseId()].indexOf(Object.keys(result)[0]);
        if (index !== -1) {

        }
        else {
          list[this.valuesAndDependenciesStore.getCaseId()].push(Object.keys(result)[0])
          this.valuesAndDependenciesStore.storeGlobalList1(list)
          this.deleteFields = this.valuesAndDependenciesStore.getGlobalList2()
          this.deleteFields[caseId].push(Object.keys(result)[0])
          this.valuesAndDependenciesStore.storeGlobalList2(this.deleteFields)
        }

        this.feldsInfo = { ...this.feldsInfo, ...result }
        console.log(this.componentProperties)
        this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(JSON.stringify(this.feldsInfo));
        this.valuesAndDependenciesStore.pushFieldChanges(this.componentProperties.source)
        // this.sendBack()
      }
      this.getFieldInfo()
    });
  }



  getFieldInfo() {

    return this.feldsInfo



  }
  sortNull() { }

  selectedConversionFactor: string; // Default unit is 'Units'
  selectedUnitsValue;
  updateUnits(conversionFactor: string,isConvertingFromCheckbox:any) {
    for(let tab_id in this.valuesAndDependenciesStore.convertableData){
      let item = this.valuesAndDependenciesStore.convertableData[tab_id];
  
      if(item["source"].includes(this.componentProperties.source)){
        item["selected_units"] = conversionFactor;
        item["isChecked"] = this.isChecked;
 
        break;
      }
    }
    this.selectedUnitsValue = conversionFactor;
    this.valuesAndDependenciesStore.setConversionFactor(this.selectedUnitsValue)
    let source = this.componentProperties.source;

    this.unitsList = this.valuesAndDependenciesStore.getSelectedUnitsObj();

    this.unitsList = { ...this.unitsList, [source]: conversionFactor }
    this.valuesAndDependenciesStore.storeSelectedUnitsObj(this.unitsList)
    this.valuesAndDependenciesStore.setComponentCommonDataProp("selected_units",JSON.stringify(this.unitsList))

    // Update the table data with the new unit conversion factor
    console.log(this.componentProperties.source);
    this.valuesAndDependenciesStore.convertUnits(this.oldValue, conversionFactor,this.isChecked,isConvertingFromCheckbox)
    this.oldValue = conversionFactor;
    this.loadCompoenent()
    this.initializeSelectedValues()
    if (this.feldsInfo['tab_view']) {
      // Ensure rowData length is one less than selectedValues
      const rowData = this.tableData.rowData;
      for (let i = 0; i < rowData.length; i++) {
        rowData[i] = {
          ...rowData[i],
          formula: this.selectedValues[i].formula,
          aging: this.selectedValues[i].aging,
          margin: this.selectedValues[i].margin,
          value: this.selectedValues[i].value
        };
      }
      this.feldsInfo['tab_view'] = { ...this.tableData, rowData };
    }
  }

  updateTableUnits(oldValue: string, conversionFactor: string) {

    let count = 0;
    let data = this.getFieldInfo();
    let i = 0
    for (let key in this.getFieldInfo()) {
      i = i + 1
      let value
      let number;

      if (typeof data[key] === 'object' && data[key] !== null) {
        value = this.selectedValues[i - 1].value
      } else {
        // console.log("myVariable is not an object.");
        value = this.getFieldInfo()[key];
      }
      if (typeof value === "string") {
        number = parseFloat(value.replace(/,/g, ''));
      } else {
        number = parseFloat(value[0].replace(/,/g, ''));
      }

      let x = parseInt(conversionFactor)
      let y = parseInt(oldValue)

      if (!isNaN(number)) {
        // Determine whether to multiply or divide based on the conversion direction
        let result;
        if (y > x) {
          // Change from higher to lower, divide
          let k = x / y
          result = number * k

        } else if (x > y) {
          // Change from lower to higher, multiply
          result = number * (x / y);
        } else {
          count = 1;
          break;
        }

        // Round the result to 2 decimal places
        if (this.isObject(data[key])) {
          if (this.getFieldInfo()[key]) {
            if (this.getFieldInfo()[key]['a.v'][this.selectedValues[i - 1].key]) {
              this.getFieldInfo()[key]['a.v'][this.selectedValues[i - 1].key] = (Math.round(result * 100) / 100).toString();

            }
            if (this.getFieldInfo()[key]['r.v'][this.selectedValues[i - 1].key]) {
              this.getFieldInfo()[key]['r.v'][this.selectedValues[i - 1].key] = (Math.round(result * 100) / 100).toString();
            }
          }
          this.selectedValues[i - 1].value = (Math.round(result * 100) / 100).toString();


        }
        else {
          this.getFieldInfo()[key] = (Math.round(result * 100) / 100).toString();
          this.selectedValues[i - 1].value = (Math.round(result * 100) / 100).toString();

        }
        let newValue = (Math.round(result * 100) / 100).toString();
        console.log(result)
        this.selectionChangeEvent(key, this.selectedValues[i - 1].subKey, newValue, i - 1)


      } else {
        // If the value is not a number, just keep it as is
        this.getFieldInfo()[key] = value;
      }


      if (count === 1) {
        break;
      }


    }

    this.oldValue = conversionFactor

    this.sendBack()
  }


  openDeleteFieldPopup(fieldName: string): void {
    // Check if the field is manually added before showing the delete confirmation
    const dialogRef = this.dialog.open(DeleteFieldPopupComponent, {
      data: { fieldName },

      width: '300px', // Set the dialog width as per your needs
      position: { right: '0px' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmDelete) {
        // Perform the delete operation for the manually added field
        this.deleteField(fieldName);
      }
    });
  }

  deleteField(fieldName: string): void {
    // Implement logic to delete the manually added field from your data structure
    let caseId = this.valuesAndDependenciesStore.getCaseId();
    let list = this.valuesAndDependenciesStore.getGlobalList1();
    this.deleteFields = this.valuesAndDependenciesStore.getGlobalList2();
    let index = this.deleteFields[caseId].indexOf(fieldName);
    this.deleteFields[caseId].splice(index, 1)
    this.valuesAndDependenciesStore.storeGlobalList2(this.deleteFields);

    delete this.feldsInfo[fieldName]
    // Update the form control value
    this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(JSON.stringify(this.feldsInfo));
    // Optionally, trigger any additional actions or updates
    this.valuesAndDependenciesStore.pushFieldChanges(this.componentProperties.source);
  }




  enablerubberbanding(field_unique_name) {
    this.authService.enableRubberbandingListOfInputs.next({ field_unique_name })
  }

  crop(field_unique_name,fieldValue) {
    // Set keyclicked to false for the specific field being cropped
    this.currentCroppingFieldData = this.valuesAndDependenciesStore.getCropClickedData();

    Object.keys(this.currentCroppingFieldData).forEach(key => {
      this.currentCroppingFieldData[key] = false;
    });
    this.currentCroppingFieldData = { ...this.currentCroppingFieldData, [field_unique_name]: true }
    this.valuesAndDependenciesStore.setCropClickedData(this.currentCroppingFieldData)

    this.authService.enableCropToSelectValueListOfInputs.next({ field_unique_name,fieldValue })
  }

  changeNumFormat(field_unique_name, index) {
    let fields = this.getfeldsInfo();
    if (!this.isObject(fields[field_unique_name])) {
      fields[field_unique_name] = this.convertToMillions(fields[field_unique_name])
      this.selectedValues[index].value = fields[field_unique_name]
    }
    else {
      if (fields[field_unique_name].hasOwnProperty('a.v')) {
        for (let innerKey in fields[field_unique_name]['a.v']) {
          fields[field_unique_name]['a.v'][innerKey] = this.convertToMillions(fields[field_unique_name]['a.v'][innerKey]);
        }
      }
      if (fields[field_unique_name].hasOwnProperty('r.v')) {
        for (let innerKey in fields[field_unique_name]['r.v']) {
          fields[field_unique_name]['r.v'][innerKey] = this.convertToMillions(fields[field_unique_name]['r.v'][innerKey]);
        }
      }
      this.selectedValues[index].value = this.getFirstOption(fields[field_unique_name]['a.v'])
    }
    this.feldsInfo = fields
    let selectedTabName = this.componentProperties.source;
    let result = this.valuesAndDependenciesStore.getJsonRecommendationFields();
    if (selectedTabName) {

      if (result.hasOwnProperty(selectedTabName)) {
        result[selectedTabName] = {
          ...result[selectedTabName], [this.selectedValues[index].key]: {
            [this.selectedValues[index].subKey]: this.selectedValues[index].value
          }
        }
      } else {
        result[selectedTabName] = {
          [this.selectedValues[index].key]: {
            [this.selectedValues[index].subKey]: this.selectedValues[index].value
          }
        };
      }
    }

    this.valuesAndDependenciesStore.setJsonRecommendationFields(result);
    this.sendBack()


  }


  convertToMillions(numberStr: string): string {
    // Remove any existing commas or spaces from the input string
    numberStr = numberStr.replace(/[,\s]/g, '');

    // Check if the input string is a valid number
    if (!/^\d+(\.\d+)?$/.test(numberStr)) {
      throw new Error("Input string is not a valid number");
    }

    // Split the number into integer and decimal parts
    const [integerPart, decimalPart] = numberStr.split('.');

    // Reverse the integer part to start from the units place
    const reversedNumber = integerPart.split('').reverse().join('');

    // Insert commas every 3 characters
    const chunks = [];
    for (let i = 0; i < reversedNumber.length; i += 3) {
      chunks.push(reversedNumber.slice(i, i + 3));
    }

    // Join the chunks with commas and reverse the string back
    const formattedIntegerPart = chunks.join(',').split('').reverse().join('');

    // Combine the formatted integer part with the decimal part (if it exists)
    return decimalPart ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;
  }

  checkIfAnyKeyClicked() {
    // Check if any key is clicked
    for (const key in this.keyclickedMap) {
      if (this.keyclickedMap[key]) {
        return true;
      }
    }
    return false;
  }

  keyclicked = false
  checkIfEdited(key) {
    let selectedTabName = this.componentProperties.source;
    let jsonData = this.valuesAndDependenciesStore.getJsonRecommendationFields()
    if (jsonData) {
      if (jsonData[selectedTabName] && jsonData[selectedTabName][key]) {
        return true
      }
    }
    return false
  }

  getkeyPressed(key) {


    if (this.keyclickedMap[key]) {
      return this.keyclickedMap[key];
    }
    return false;
  }


  hasValue(value, key) {

    if (!this.keyclickedMap[key]) {
      if (value) {
        return true
      }
      else {
        return false
      }
    }
    else {
      return false
    }

  }

  hasValueinList(key) {

    let caseId = this.valuesAndDependenciesStore.getCaseId()
    let list = this.valuesAndDependenciesStore.getGlobalList1();

    if (list.hasOwnProperty(caseId)) {
      // Check if the valueToCheck exists in the array for the given caseId
      if (list[caseId].includes(key)) {

        return true
      }
    }
    return false

  }

  onNameChange() {

  }


  ngOnDestroy() {
    if (this.callJsonCrop) {
      this.callJsonCrop.unsubscribe();
      this.valuesAndDependenciesStore.setCropClickedData({});
      this.valuesAndDependenciesStore.storeSelectedUnitsObj({});
    }
  }
  getFirstOption(object: any) {
    const list = [];
    for (const key in object) {
      list.push(object[key]);

    }
    return list[0];
  }


  isObject(value) {
    return typeof value === 'object' && value !== null && !(Object.keys(value).length === 0 && value.constructor === Object);
  }

  selectedOption: any;
  getselectedOption(item, key, value) {
    let selectedTabs = this.authService.getSelectedTabId();
    let selectedTabName = selectedTabs["tab_name"]
    console.log(selectedTabName);
    console.log(item, key, value)
    let result = {};
    if (selectedTabName) {
      result[selectedTabName] = {
        [item]: {
          [key]: value
        }
      };
    }




    console.log(result);
  }

  selectedValues: { key: any, value: any, subKey: any, formula: any, aging: any, margin: any }[] = [];


  initializeSelectedValues(): void {
    const fieldInfo = this.getFieldInfo();
    const keys = Object.keys(fieldInfo);
    keys.forEach((key, index) => {
      let fieldValue = fieldInfo[key];
      if ((Object.keys(fieldValue).length === 0)) {
        this.feldsInfo[key] = ""
        fieldValue = ""
      }
      const formula_ = fieldValue ? fieldValue : ""
      const aging_ = this.tableData.rowData[index] ? this.tableData.rowData[index]['aging'] : ""
      const margin_ = this.tableData.rowData[index] ? this.tableData.rowData[index]['margin'] : ""
      if (this.isObject(fieldValue)) {
        // Handle object type differently
        const firstOption = this.getFirstOption(fieldValue['a.v']);
        const firstKey = this.getFirstkey(fieldValue['a.v']);
        this.selectedValues[index] = { key: key, value: firstOption, subKey: firstKey, formula: firstOption, aging: aging_, margin: margin_ };
      } else {
        // Handle non-object type
        this.selectedValues[index] = { key: key, value: fieldValue, subKey: key, formula: fieldValue, aging: aging_, margin: margin_ };
      }
    });

  }


  getFirstkey(object: any) {
    const list = [];
    for (const key in object) {
      list.push(key);
    }
    return list[0];
  }
  switchInterface = false

  toggleInterface() {
    this.switchInterface = !this.switchInterface
  }

  editing: { [key: string]: boolean } = {};
  editField(element: any, column: string) {
    this.editing[this.getKey(element, column)] = true;
  }

  isEditing(element: any, column: string) {
    return this.editing[this.getKey(element, column)];
  }


  onEditComplete(element: any, column: string) {
    this.editing[this.getKey(element, column)] = false;
    const index = this.tableData.rowData.indexOf(element);
    console.log('tableData', this.tableData)
    console.log('fieldsInfo', this.feldsInfo)
    this.selectedValues[index].formula = this.tableData.rowData[index]['formula']
    this.selectedValues[index].aging = this.tableData.rowData[index]['aging']
    this.selectedValues[index].margin = this.tableData.rowData[index]['margin']
    this.selectedValues[index].value = this.tableData.rowData[index]['value']
    this.feldsInfo['tab_view'] = this.tableData
    this.sendBack()

  }
  getKey(element: any, column: string) {
    return `${this.tableData.rowData.indexOf(element)}-${column}`;
  }
  calculateWidth(text: string): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '14px Arial'; // Use the font you are using in your table
    return context.measureText(text).width + 20; // Add some padding
  }
  selectionChangeEvent(key: any, event: any, value: any, index: number,isUnsubscribed:boolean = false) {
    let formula_ = value;
    let finalValue = value;
    let aging_ = this.selectedValues[index].aging
    let margin_ = this.selectedValues[index].margin
    this.selectedValues[index] = { key: key, value: finalValue, subKey: event, formula: formula_, aging: aging_, margin: margin_ };
    if(isUnsubscribed){
      this.feldsInfo[key] = "";
    }else if (this.feldsInfo[key] && this.feldsInfo[key]['r.v'] && this.feldsInfo[key]['r.v'][this.selectedValues[index].subKey]) {
      let rvKey = this.selectedValues[index].subKey
      let avKey = this.getFirstkey(this.feldsInfo[key]['a.v'])
      let avValue = this.getFirstOption(this.feldsInfo[key]['a.v'])
      if (avKey !== rvKey) {
        let allFieldsInfo = this.feldsInfo
        allFieldsInfo[key]['r.v'][avKey] = avValue
        delete allFieldsInfo[key]['a.v'][avKey]
        allFieldsInfo[key]['a.v'][rvKey] = value
        delete allFieldsInfo[key]['r.v'][rvKey]
        this.feldsInfo = JSON.parse(JSON.stringify(allFieldsInfo));
      }

    }

    // Update the formula in the actual tableData
    if (this.feldsInfo['tab_view']) {
      const row = this.tableData.rowData[index];
      this.tableData.rowData[index] = {
        ...row,
        formula: formula_,
        aging: aging_,
        margin: margin_,
        value: finalValue
      };
      this.feldsInfo['tab_view'] = this.tableData
    }

    if (this.isObject(this.feldsInfo[key])) {
      if (this.feldsInfo[key]['a.v'][event] !== finalValue) {
        this.feldsInfo[key]['a.v'][event] = finalValue
      }
    }
    
    let selectedTabName = this.componentProperties.source;
    let result = this.valuesAndDependenciesStore.getJsonRecommendationFields();
    if (selectedTabName) {

      if (result.hasOwnProperty(selectedTabName)) {
        result[selectedTabName] = {
          ...result[selectedTabName], [key]: {
            [event]: value
          }
        }
      } else {
        result[selectedTabName] = {
          [key]: {
            [event]: value
          }
        };
      }
    }

    this.valuesAndDependenciesStore.setJsonRecommendationFields(result);
    this.valuesAndDependenciesStore.setComponentCommonDataProp(this.componentProperties.source,JSON.stringify(this.feldsInfo))
    this.componentProperties.formgroup.controls[this.componentProperties.source].setValue(JSON.stringify(this.feldsInfo));

  }

  convertAllFieldsToMillions() {
    this.valuesAndDependenciesStore.convertAllFieldsToMillions();
  }

  onChecked(event:any){
    const inputElement = event.target as HTMLInputElement;
    this.isChecked = inputElement.checked;

    let reqSelectedUnits = this.selectedUnitsValue;

    for(let tab_id in this.valuesAndDependenciesStore.convertableData){
      let item = this.valuesAndDependenciesStore.convertableData[tab_id];
      if (item["isChecked"] == this.isChecked) {
        reqSelectedUnits = item["selected_units"];
        break;
      }

    }
      for(let tab_id in this.valuesAndDependenciesStore.convertableData){
        let item = this.valuesAndDependenciesStore.convertableData[tab_id];
    
        if(item["source"].includes(this.componentProperties.source)){
          item["selected_units"] = reqSelectedUnits;
          item["isChecked"] = this.isChecked;
          
          this.updateUnits(reqSelectedUnits,true);
          break;
        }
      }
  }

  openErrorDialog(){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '400px';
    dialogConfig.data = {
      heading: "Alert",
      text:["The field should only contain numeric characters, decimal points, and commas."],
      buttonname:this.componentProperties["button_name"] ?this.componentProperties["button_name"] :"Confirm",
      confirm: false,
      cancel:true,
      ok:true
    };

    dialogConfig.position={
      left:'50%',
      right:'50%'
    }


    const dialogRef = this.dialog.open(CallbackPopupComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
    if(result){
    }
     
    else{

    }
    dialogRef.close({flag: false})
  });
  }

  toggleSubscriptionStatus(item:any,index:any){
    const keyIndex = this.subscriptionStatusKeys.indexOf(item.key);
    if(keyIndex > -1){
      this.subscriptionStatusKeys.splice(keyIndex,1)
      const value = this.valuesAndDependenciesStore.unsubscribedFieldCache.get(item.key);

      // const event = { target: { value: value } } as unknown as Event;
      // this.keyUpCheck(event, item.key, item.value, "", index)
      // this.changedValue(event,item,index);
      this.valuesAndDependenciesStore.unsubscribedFieldCache.delete(item.key);
      this.feldsInfo[item.key] =  value;
      this.initializeSelectedValues()
      this.sendBack();
    }else{
      this.subscriptionStatusKeys.push(item.key);
      this.valuesAndDependenciesStore.unsubscribedFieldCache.set(item.key,item.value);
      const event = { target: { value: '' } } as unknown as Event;
      this.keyUpCheck(event, item.key, item.value, "", index,true)
      this.changedValue(event,item,index);
     
    }
    this.valuesAndDependenciesStore.setComponentCommonDataProp("unsubscribed_fields",this.subscriptionStatusKeys);
    this.valuesAndDependenciesStore.storeUnsubscribedFields(this.subscriptionStatusKeys);
  }

  resetHeaderContext(fieldName){
    this.headerContextTrainedFields = this.headerContextTrainedFields.filter(
      (item: any) => item !== fieldName
    );
    this.valuesAndDependenciesStore.setHeaderContextData(fieldName,"","","context_clear");
    delete this.valuesAndDependenciesStore.trainedHighLightFields[this.caseId][fieldName];
  }

  enableHeaderContextRubberBanding(fieldName){
    this.authService.enableHeaderContextRubberBanding.next({fieldName})
  }

  isResetContextVisible(fieldName){
    if(this.valuesAndDependenciesStore.headerContextData){
      if(this.valuesAndDependenciesStore.headerContextData[fieldName] && this.isObject(this.valuesAndDependenciesStore.headerContextData[fieldName])){
        const keys = Object.keys(this.valuesAndDependenciesStore.headerContextData[fieldName]);    
        // Check if it contains header, context and value  
        if (keys.length === 3) {
          return true;
        }
      }
    }
    return false;
  }
}
