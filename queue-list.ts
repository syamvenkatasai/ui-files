import { SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExceptionTableModel } from 'src/app/core/model/exceptions/exception-table-model';
//import { ResizeEvent } from 'angular-resizable-element';
import { BuilderConfigurationService } from 'src/app/core/services/builder-configuration.service';
import { ComponentStoreService } from 'src/app/core/services/component-store/component-store.service';
import { AuthService } from 'src/app/core/services/global/authentication.service';
import { MaskEventService } from 'src/app/core/services/mask-event.service';
import { DataService } from 'src/app/core/services/serviceBridge/data.service';
import { NavtabService } from 'src/app/core/services/navtab.service';
import { ValuesAndDependencyStoreService } from 'src/app/field-exception/service/values-dependencies-store.service';
import { DynamicComponentsInterfaceComponent } from '../dynamic-components';
import { QueueListProperties } from './queueListProperties';
import { TableTestData } from './tabelData';
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

declare var $: any;

@Component({
  selector: 'app-generate-queue-list',
  templateUrl: './generate-queue-list.component.html',
  styleUrls: ['./generate-queue-list.component.scss']
})
export class GenerateQueueListComponent extends DynamicComponentsInterfaceComponent implements OnInit, OnDestroy {
  displayedColumns = [];
  columnMap: any = {};
  dataSource = new MatTableDataSource();
  pathId = '';
  @ViewChild(MatSort) sort: MatSort;
  private killTrigger: Subject<void> = new Subject();
  paginatorData = {};
  currentPageNumber = 1;
  numberofRecordsPerPage = 20;
  max = 100;
  stroke = 6;
  radius = 20;
  fileSelected = false;
  formPageHidden = false;
  sortedData = [];

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

  header_font_size
  row_font_size
  row_size;
  pagination_font

  @ViewChild('table') table: MatTable<Element>;
  @Output() sendProperties = new EventEmitter();
  styleObject: any;
  selection = new SelectionModel<any>(true, []);
  storeColumnMapping = [];
  columnData = {};
  filterArray = [];
  filter_data: any = {"column_order": "", "column_name": "", "sort_order": "", "data_type": ""};
  resetFilteredData:boolean = false;

  filterText = ""
  filterApplied = false;

  additionalColumns = new FormControl();
  allColumns: string[] = [];

  searchFilters = {}


  @Input()
  set builderData(val) {

      //console.log(val)
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
  };

  startFile;
  endFile;
  panelOpenState = false;
  currentClass='theme_1';
  updateFieldsSub:any;
  constructor(
    private dynamicPopServ: DynamicPopupService,
    private dataService: DataService, private maskEvent: MaskEventService,
    private router: Router, private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private authService: AuthService, private valuesAndDependenciesStore: ValuesAndDependencyStoreService,
    private compStore: ComponentStoreService, private elem: ElementRef,
    private buliderConfiguration: BuilderConfigurationService, private statusService: StatusService,private navTabService : NavtabService,
    private rules: BizrulesService, private dialog: MatDialog) {
    super(compStore, valuesAndDependenciesStore);
    this.authService.classtoAddSubject.subscribe((value) =>
    this.currentClass = value
    )
  }

  randomId = ""
  pageHeading = ""
  updatePreviewSub: any;
  stats_caseid;
  view_card :any
  store_status = {}
  colors_list = []
  filters_view = false
  override ngOnInit() {
    this.authService.classtoAddSubject.next(this.authService.getCurrentTheme());
    this.randomId = this.authService.randomID(8)
    this.valuesAndDependenciesStore.setDynamicGlobalVariables({})
    this.valuesAndDependenciesStore.setMultiInfo({})
    this.valuesAndDependenciesStore.setComponentCommonData({})
    

    //console.log(this.bOrCon)
    if (this.bOrCon != 'builder' && this.bOrCon == 'view') {
      this.pageHeading = this.componentProperties['text'] || ""
      this.tenant_id = this.authService.getTenantId();
      this.view_card = this.componentProperties['viewascard'] || false

      this.header_font_size = this.componentProperties['header_font_size'] + 'px' || "14px"
      this.row_font_size = this.componentProperties['row_font_size'] + 'px' || "14px"
      this.row_size = this.componentProperties['row_size'] + 'px' || "36px"
      this.pagination_font = this.componentProperties['pagination_font'] + 'px' || "13px"

      if(this.componentProperties["filter_view"]){

        this.filters_view = this.componentProperties["filter_view"]
      }
      else{
        this.filters_view = false
      }
      this.loadCompoenent();
      this.updatePreviewSub = this.authService.update_preview.subscribe(value => {
        this.maskEvent.mask(this.randomId, 'Loading...');
        this.getExceptions(1, this.numberofRecordsPerPage);
      });
      this.additionalColumns.valueChanges.subscribe(values => {
        this.resetDisplayedColumns(values)
      })
      this.authService.filter_values.subscribe(value => {
        this.searchFilters = value
        this.filterApplied = true
        this.maskEvent.mask(this.randomId, 'Loading...');
        this.getExceptions(1, this.numberofRecordsPerPage);
      });

      this.authService.clear_filter_values.subscribe(value => {
        this.searchFilters = {}
        this.filterApplied = false
        this.maskEvent.mask(this.randomId, 'Loading...');
        this.getExceptions(1, this.numberofRecordsPerPage);
      });


      this.rules.tablecolumncolor.subscribe(params => {
        let obj  = params;
        this.colors_list.push(obj)
        // //console.log(params)
        this.store_status = params
        this.setcolor = true
        this.check_color()
      });

      this.stats_caseid = this.route.snapshot.queryParams["case_id"];
      //console.log(this.stats_caseid)
    }
    else{

    }
  }

  setcolor = false;
  check_color(){
       return this.setcolor
  }

  resetDisplayedColumns(selectedValues) {

    let tenantId = this.authService.getTenantId()
    if(this.filters_view){
      this.displayedColumns = selectedValues.map((x) => x)
      this.authService.storeFiltedredColumns(this.displayedColumns)

    }
    else{
      this.displayedColumns = selectedValues.map((x) => x)
    }

  }

  columnTypes = {}
  defaultSortName = "";
  defaultSortType = "";
  generateColumnTypes(col_map) {
    col_map.forEach(col => {
      if (col.default_sort) {
        this.defaultSortName = col.display_name
        this.defaultSortType = col.default_sort
      }
      this.columnTypes[col.display_name] = {
        column_type: col.column_type,
        buttons: col.buttons
      }
    });
  }



  setProperties(e) {
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



    //pagnition
    if (e && e.showPagination) {
      this.showPagination = e.showPagination
    }
    else {
      this.showPagination = false
    }

    //search
    if (e && e.showSearch) {
      this.showSearch = e.showSearch
    }
    else {
      this.showSearch = false
    }

    //mapping
    if (e && e.column_mapping) {
      this.storeColumnMapping = e.column_mapping;
      let column_mapping = {};
      let column_order = [];
      let modify_column_order = [];

      for (let item of e.column_mapping) {
        if (item["column_name"] !== "" && item["display_name"] !== "") {
          let splitColumnName = item["column_name"].split('.');
          column_mapping[item["display_name"]] = splitColumnName[1];
          column_order.push(item["display_name"]);
          for (let item1 in TableTestData.data.column_data_types) {
            if (item1 == splitColumnName[1]) {
              let obj = { "display_name": item["display_name"], "column_type": item["column_type"], "column_buttons": item["buttons"], "column_name": splitColumnName[1], "isChecked": true, "data_type": TableTestData.data.column_data_types[item1] };
              modify_column_order.push(obj);
            }
          }
        }
      }
      this.generateColumnTypes(e.column_mapping);
      this.columnMap = column_mapping;
      this.displayedColumns = column_order.filter((v, i, a) => a.indexOf(v) === i);
      this.columnFilterInput = modify_column_order;

      if (e.showSelection && !this.displayedColumns.includes('select')) {
        this.displayedColumns.unshift('select');
      }
    }
    else {
      let modify_column_order = [];
      this.columnMap = TableTestData.data.column_mapping;
      this.columnTypes = TableTestData.data.columnTypes;
      this.displayedColumns = TableTestData.data.column_order;
      this.displayedColumns.forEach(element => {
        for (let item1 in TableTestData.data.column_data_types) {
          let obj = { "display_name": element, "column_name": this.columnMap[element], "isChecked": true, "data_type": TableTestData.data.column_data_types[item1] };
          modify_column_order.push(obj);
        }
      })
      this.columnFilterInput = modify_column_order;
    }
  }


  getCol(v) {
    let q = v.split('.');
    if (q.length === 1) {
      return q[0]
    }
    return q[1]
  }

  getColumnsFromMapping(cols) {
    let colToReturn = []
    for (let i = 0; i < cols.length; i++) {
      let col_ = cols[i].display_name
      colToReturn.push(col_)
    }
    return colToReturn
  }

  loadCompoenent() {
    if (this.bOrCon == 'builder') {
      this.dataSource = new MatTableDataSource<any>(TableTestData.data.files);
    }
    else {
      this.pathId = this.route.snapshot.queryParams['pathId'];
      this.showPagination = this.componentProperties.showPagination ? this.componentProperties.showPagination : false
      this.showSearch = this.componentProperties.showSearch ? this.componentProperties.showSearch : false;
      this.generateColumnTypes(this.componentProperties.column_mapping)

      this.loadQueueListWithParams();
      setTimeout(() => {
      this.runFieldLevelBusinessRule(this.componentProperties, 'onload')
    },1000)
    }
  }

  sendingProperties() {
    this.sendProperties.emit({ properties: QueueListProperties, id: this.comp_id });
    this.prop_sent = true
  }

  override checkDependencyTypeandExecute(dependencyName) {
    switch (dependencyName) {
      case "load_component":
        this.loadQueueListWithParams();
        break;
    }
  }

  loadQueueListWithParams() {
    this.maskEvent.mask(this.randomId, 'Fetching Cases..');
    this.numberofRecordsPerPage = this.componentProperties.files_count ? Number(this.componentProperties.files_count) : 20
    this.startFile = 1;
    this.endFile = this.numberOfFilesPerPage;
    if (this.componentProperties.autoreload) {
      let reloadTime = (Number(this.componentProperties.autoreloadtime) || 5) * 1000 * 60
      timer(0, reloadTime)
        .pipe(
          // This kills the request if the user closes the component
          takeUntil(this.killTrigger),
        )
        .subscribe(t => {
          if (this.currentPageNumber === 1 && !this.fileSelected && !this.filterApplied) {
            this.getExceptions(1, this.numberofRecordsPerPage);
          }
        });
    } else {
      this.getExceptions(1, this.numberofRecordsPerPage);
    }
  }

  combineColMapWithDataType(colMap, types) {
    let col_obj = []
    for (const col in colMap) {
      let obj = {
        "display_name": col,
        "column_name": colMap[col],
        "isChecked": true,
        "data_type": types[colMap[col]]
      };
      col_obj.push(obj);
    }
    return col_obj;
  }

  getParamValue(val, element) {
    switch (val) {
      case "queue_id":
        return this.authService.getSelectedQueueId()
      case "tab_id":
        return this.componentProperties.tab_id ? this.componentProperties.tab_id.display_name : ""
      default:
        return element[val]
    }
  }

  generateQueueListFormat(resp) {
    this.displayedColumns = []
    this.columnMap = {}
    this.componentProperties.column_mapping.forEach(col__ => {
      this.columnMap[col__['display_name']] = col__['column_name'].split('.')[1]
      this.displayedColumns.push(col__['display_name'])
    });
  }

  cardData = []
  filterCard = []
  getExceptions(start, end) {
    this.cardData = []
    this.filterCard = []
    let modify_column_order = [];
    let params: any = {
      queue_id: this.pathId,
      start: start,
      end: end,
      search_filters: this.searchFilters,
      filter_data: this.filter_data || {"column_order": "", "column_name": "", "sort_order": "", "data_type": ""},
      search_text : this.filterText,
      url: this.componentProperties.url ? this.componentProperties.url : 'get_queue'
    };

    params.variables = {}

    if (this.componentProperties.variables && this.componentProperties.variables.length > 0) {
      this.componentProperties.variables.forEach(variable => {
        params.variables[variable.key] = variable.value;
      });
    }

    if(this.componentProperties.params) {
      let extra_params = this.componentProperties.params.split(',')
      extra_params.forEach(param => {
        params[param.trim()] = this.valuesAndDependenciesStore.getParamValue(param.trim(), this.componentProperties)
      });
    }
    this.dataService.getExceptions(params).subscribe(
      (response) => {
        this.maskEvent.unMask(this.randomId);
        this.valuesAndDependenciesStore.storeFileTabName = "";
        this.valuesAndDependenciesStore.storeEditedFields([]);
        this.valuesAndDependenciesStore.storeSelectedUnitsObj({});
        this.valuesAndDependenciesStore.setJsonRecommendationFields({})
        if (response.data) {
          if (response.data.column_mapping){
            delete response.data.column_mapping[""]
          }


          this.generateQueueListFormat(response.data);

          if (this.componentProperties['showSelection'] && this.displayedColumns.indexOf('select') == -1) {
            this.displayedColumns.unshift('select')
          }
          let storedColumns = this.authService.getFilteredColumns()
          //console.log(storedColumns)
          this.additionalColumns.setValue(storedColumns.length > 0 ? storedColumns :this.displayedColumns);
          this.allColumns = this.displayedColumns.map(x => x);
          this.cardData = response.data.files
          this.storeGlobal();
          this.storeGlobal1();
          this.storeGlobal2();
          this.storeGlobal3();
          if(response.data.card_columns){
            for (let i = 0; i < this.cardData.length; i++) {
                  let newobj  = {}
                  for (const key in this.cardData[i]) {
                    if(response.data.card_columns.includes(key)){
                       newobj[key] = this.cardData[i][key]
                      }
                    }
                    this.filterCard.push(newobj)
                }
          }
          this.dataSource = new MatTableDataSource<ExceptionTableModel>(response.data.files);
          this.dataSource.sort = this.sort;
          this.sortedData = response.data.files.slice();
          this.paginatorData = response.data.pagination;

          if (response.data.cascade_object) {
            this.valuesAndDependenciesStore.setGlobalVariables({ 'cascade_object': response.data.cascade_object })
          }

          if (response.data.reports) {
            this.valuesAndDependenciesStore.setReportsData(response.data.reports);
          }
        }
      },
      (error) => {
        this.maskEvent.unMask(this.randomId);
      });

  }
  storeList = []
  storeGlobal(){

    if( this.valuesAndDependenciesStore.getGlobalList() && Object.keys(this.valuesAndDependenciesStore.getGlobalList()).length > 0){
      for (let i = 0; i < this.cardData.length; i++) {
        if (this.valuesAndDependenciesStore.getGlobalList() && Object.keys(this.valuesAndDependenciesStore.getGlobalList()).length > 0 && this.valuesAndDependenciesStore.getGlobalList().hasOwnProperty(this.cardData[i]["case_id"])) {

        }
        else{
          this.valuesAndDependenciesStore.getGlobalList()[this.cardData[i]["case_id"]] = []
        }
       }
    }
    else{
       let obj = {}
       for (let i = 0; i < this.cardData.length; i++) {
         obj[this.cardData[i]["case_id"]] = []
       }
       this.valuesAndDependenciesStore.storeGlobalList(obj)
    }
  }

  storeList1 = []
  storeGlobal1(){

    if( this.valuesAndDependenciesStore.getGlobalList1() && Object.keys(this.valuesAndDependenciesStore.getGlobalList1()).length > 0){
      for (let i = 0; i < this.cardData.length; i++) {
        if (this.valuesAndDependenciesStore.getGlobalList1() && Object.keys(this.valuesAndDependenciesStore.getGlobalList1()).length > 0 && this.valuesAndDependenciesStore.getGlobalList1().hasOwnProperty(this.cardData[i]["case_id"])) {

        }
        else{
          this.valuesAndDependenciesStore.getGlobalList1()[this.cardData[i]["case_id"]] = []
        }
       }
    }
    else{
       let obj = {}
       for (let i = 0; i < this.cardData.length; i++) {
         obj[this.cardData[i]["case_id"]] = []
       }
       this.valuesAndDependenciesStore.storeGlobalList1(obj)
    }
  }



  storeGlobal2(){

    if( this.valuesAndDependenciesStore.getGlobalList2() && Object.keys(this.valuesAndDependenciesStore.getGlobalList2()).length > 0){
      for (let i = 0; i < this.cardData.length; i++) {
        if (this.valuesAndDependenciesStore.getGlobalList2() && Object.keys(this.valuesAndDependenciesStore.getGlobalList2()).length > 0 && this.valuesAndDependenciesStore.getGlobalList2().hasOwnProperty(this.cardData[i]["case_id"])) {

        }
        else{
          this.valuesAndDependenciesStore.getGlobalList2()[this.cardData[i]["case_id"]] = []
        }
       }
    }
    else{
       let obj = {}
       for (let i = 0; i < this.cardData.length; i++) {
         obj[this.cardData[i]["case_id"]] = []
       }
       this.valuesAndDependenciesStore.storeGlobalList2(obj)
    }
  }


  storeGlobal3(){


    if( this.valuesAndDependenciesStore.getGlobalList3() && Object.keys(this.valuesAndDependenciesStore.getGlobalList3()).length > 0){
      for (let i = 0; i < this.cardData.length; i++) {
        if (this.valuesAndDependenciesStore.getGlobalList3() && Object.keys(this.valuesAndDependenciesStore.getGlobalList3()).length > 0 && this.valuesAndDependenciesStore.getGlobalList3().hasOwnProperty(this.cardData[i]["case_id"])) {

        }
        else{
          this.valuesAndDependenciesStore.getGlobalList3()[this.cardData[i]["case_id"]] = {}
        }
       }
    }
    else{
       let obj = {}
       for (let i = 0; i < this.cardData.length; i++) {
         obj[this.cardData[i]["case_id"]] = {}
       }
       this.valuesAndDependenciesStore.storeGlobalList3(obj)
    }
  }

  deleteEmptyKey(obj) {
    delete obj[""]
    return obj
  }


  getValue(key) {
    return this.columnMap[key];
  }

  getNextOrPreviousRecords(event) {
    this.currentPageNumber = event.pageNumber;
    this.startFile = event.start
    this.endFile = event.end
    this.maskEvent.mask(this.randomId, 'Loading...');
    this.getExceptions(this.startFile, this.endFile);

  }

startDate: Date;
endDate: Date ;
isFilterApplied: string = ''

    

  applyFilter(filterValue: string) {
    this.filterText = filterValue.trim().toLowerCase();
    if(this.view_card){
      this.getData()
    }
    else{
      if(this.filterText.length === 0 && this.filterApplied) {
        this.filterApplied = false;
        this.maskEvent.mask(this.randomId, 'Loading...');
        this.getExceptions(1, this.numberofRecordsPerPage)
      } else {
        this.dataSource.filter = filterValue.trim().toLowerCase();
      }
    }
  }

  applySearchFilter() {
    this.filterApplied = true;
    this.maskEvent.mask(this.randomId, 'Loading...');

    this.getExceptions(1, this.numberofRecordsPerPage)
  }

  audit_response = []
  routeToForm(item) {
    if (this.bOrCon != 'builder' && this.checkEditPermission(item) && this.componentProperties.dependencies.length > 0) {
      this.maskEvent.mask(this.randomId, 'Loading...');
      this.fileSelected = true;
      this.componentProperties.global_mapping = this.componentProperties.global_mapping || []
      this.componentProperties.global_mapping.forEach((mapping:any) => {
        item[mapping.mapping_key] = item[mapping.mapping_value]
      });

      let obj = this.valuesAndDependenciesStore.globalVariables || {}
      const global_params = this.componentProperties.global_params.split(",");
      let new_filter_obj = {}
      global_params.forEach(param => {
        param = param.trim();
        obj[param] = item[param]
        new_filter_obj[param] = item[param]
      });

      this.valuesAndDependenciesStore.setGlobalVariables(obj)

      this.valuesAndDependenciesStore.setDynamicGlobalVariables(new_filter_obj)

      let params = {}

      if (obj && obj["case_id"]){
        params["case_id"] = obj["case_id"]
      }

      params["user"] = this.authService.getUserName()
      params["queue_id"] = this.authService.getSelectedQueueId()
        params["filters"] = new_filter_obj


      params = {...params, ...obj}
      this.valuesAndDependenciesStore.setMultiInfo({})
      this.valuesAndDependenciesStore.setConversionFactor("")
    this.valuesAndDependenciesStore.setOldValue("")
      this.valuesAndDependenciesStore.setTabWiseData({});
      this.valuesAndDependenciesStore.setmultiTabTabWiseChangeData({});
      this.authService.setLeftViewActive(false);
      this.authService.setRightViewActive(false);
      this.navTabService.setAuditTrailOpened(false);
      this.valuesAndDependenciesStore.storeFileTabName = "";
      this.valuesAndDependenciesStore.storeEditedFields([]);
      this.valuesAndDependenciesStore.storeSelectedUnitsObj({});
      this.valuesAndDependenciesStore.headerContextData = {};
      this.valuesAndDependenciesStore.setComponentCommonData({})
      this.valuesAndDependenciesStore.setPageInfoForChangedFileTypes({})
      this.valuesAndDependenciesStore.changedFieldsFromUnitConversion = [];
      this.valuesAndDependenciesStore.storeFileTabName = ''
      this.valuesAndDependenciesStore.setAuditTrailState(this.componentProperties["showAuditTrail"])
      let caseLockParams ={}
      caseLockParams["case_id"] = this.valuesAndDependenciesStore.getCaseId();
     this.dataService.getCaseLock(caseLockParams)
     .subscribe(resp =>{
      if (resp && resp.flag){
        this.dataService.getAllFieldValues(params)
        .subscribe(resp => {
          this.maskEvent.unMask(this.randomId);
          if (resp.flag) {

            if(this.componentProperties["showAuditTrail"]){
              this.dataService.auditDetails(params).subscribe(response => {
                if (response.flag) {
                  this.audit_response = response['nodes'];
                  this.valuesAndDependenciesStore.setauditresponse(this.audit_response)
                  setTimeout(() => {
                    this.authService.showAudit.next(true)
                  }, 5000);
                }
              })
            }
            
            if (this.tenant_id === 'kmb'){
              let ordered_debtors=["Debtors 0-5 days","Debtors 6-60 days","Debtors 61-90 days", "Debtors 91-120 days",  "Debtors 151-180 days", "Debtors 121-150 days","Debtors > 180 days", "Total Debtors"];
              let key = Object.keys(resp.data)[0]
              if (resp.data[key]["DEBITORS STATEMENT_OCR"]){
              let data = JSON.parse(resp.data[key]["DEBITORS STATEMENT_OCR"])
              let tags=Object.fromEntries(
                Object.entries(data)
                  .filter(([key]) => ordered_debtors.includes(key))
                  .sort(([a], [b]) => ordered_debtors.indexOf(a) - ordered_debtors.indexOf(b))
              );
              resp.data[key]["DEBITORS STATEMENT_OCR"]=JSON.stringify(tags);

            }


            }
            this.valuesAndDependenciesStore.setMultiInfo({})
            this.valuesAndDependenciesStore.setMultiInfo(resp.data)
            this.valuesAndDependenciesStore.setTabWiseData({});
            this.valuesAndDependenciesStore.setmultiTabTabWiseChangeData({});
            this.authService.setLeftViewActive(false);
            this.authService.setRightViewActive(false);
            this.navTabService.setAuditTrailOpened(false);
            this.valuesAndDependenciesStore.storeFileTabName = "";
            this.valuesAndDependenciesStore.storeEditedFields([]);
            this.valuesAndDependenciesStore.storeSelectedUnitsObj({});

            this.valuesAndDependenciesStore.setComponentCommonData({})

            if((this.authService.getSelectedQueueId() === 10 || this.authService.getSelectedQueueId() === 11)&& this.authService.getTenantId() === 'ambanketrade' ){

              let selectedTabs =  this.authService.getSelectedTabId()
              if(selectedTabs){

                let selectedTabName = selectedTabs["tab_name"]
                // console.log(Object.values(resp.data)[0][selectedTabName])
                if (resp.data && resp.data[0] && resp.data[0].hasOwnProperty(selectedTabName)){
                  this.valuesAndDependenciesStore.setComponentCommonData(Object.values(resp.data)[0][selectedTabName])

                }
              }
            }
            else{

              this.valuesAndDependenciesStore.setComponentCommonData(Object.values(resp.data)[0])
            }

            this.valuesAndDependenciesStore.checkDependencies(this.componentProperties.component_unique_id)
            this.valuesAndDependenciesStore.storeFileTabName = ''
          }
          else{
            this.snackBar.open(resp.message, "close", {
              duration: 10000
            })
          }
        },
          (error) => {
            this.maskEvent.unMask(this.randomId);
          })
      }else if (resp){
        this.maskEvent.unMask(this.randomId);
        this.snackBar.open(resp.message, "close", {
          duration: 5000
        })

      }

     }, (error) => {
      this.maskEvent.unMask(this.randomId);
    })

  

          

    }


  }


  checkEditPermission(element: any) {
    if (this.formPageHidden) {
      return false
    } else {
        return (!element.case_lock);
    }
  }

  setColor(row){
    if(row["case_id"] == this.stats_caseid){
      return "#FFD6D6"
    }
    else{
      return ""
      // //console.log(row)
    }
  }

  getModelPercentage(data) {
    return Number(data.percent_done);
  }

  getCurrentStatus(data) {
    return data.current_status;
  }

  checkPendingStatus(data) {
    return data ? true : false;
  }

  sortData(sort: Sort) {
    const data = this.sortedData.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case sort.active: return this.compare(a[this.columnMap[sort.active]], b[this.columnMap[sort.active]], isAsc);
        default: return 0;
      }
    });
  }

 compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  updateColor(store_status){


  }

  getColor(value) {

    // //console.log(this.colors_list);
    for (let i = 0; i < this.colors_list.length; i++) {
      if(value && value.toLowerCase().includes(this.colors_list[i]["text"].toLowerCase())){
        return this.colors_list[i]["color"];
      }
    }
  }

  getTextColor(value){
    for (let i = 0; i < this.colors_list.length; i++) {
      if(value && value.toLowerCase().includes(this.colors_list[i]["text"].toLowerCase())){
        return this.colors_list[i]["text_color"];
      }
    }
  }

  getText(data) {
    if (data.failure_status === 1) {
      return 'FAILED';
    } else if (data.failure_status === 2) {
      return 'BOT FAILED'
    } else {
      if (data.percent_done < 100) {
        return 'IN PROGRESS';
      }
      else if (data && typeof data === 'string') {
        return data.toUpperCase();
      }
      else {
        return 'PROCESSED';
      }
    }
  }

  isAllSelected() {
    let notfound = 0;
    this.dataSource.data.forEach(row => {
      let idx = this.selection.selected.findIndex(x => x.case_id === row['case_id'])
      if (idx == -1) {
        notfound = 1
      }
    })
    return notfound ? false : true;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
    this.valuesAndDependenciesStore.setSelectedQueueData(this.componentProperties.component_unique_id, this.selection.selected)
  }

  rowSelect(e) {
    this.selection.toggle(e);
    this.valuesAndDependenciesStore.setSelectedQueueData(this.componentProperties.component_unique_id, this.selection.selected);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  isSticky(column_name) {
    if (this.bOrCon != 'builder') {
      let idx = this.storeColumnMapping.findIndex(x => x.display_name === column_name)
      if (idx > -1 && this.storeColumnMapping[idx].sticky_column == 'sticky_first') {
          return true;
      }
    }
    return false;
  }
  isStickyEnd(column_name) {
    if (this.bOrCon != 'builder') {
      let idx = this.storeColumnMapping.findIndex(x => x.display_name === column_name)
      if (idx > -1 && this.storeColumnMapping[idx].sticky_column == 'sticky_end') {
          return true;
      }
    }
    return false;
  }
  sendColumnData(column_name) {
    let idx = this.storeColumnMapping.findIndex(x => x.display_name === column_name)
    let obj = {
      "columnData": this.storeColumnMapping,
      "column_name": this.storeColumnMapping[idx].column_name,
      "data_type": this.storeColumnMapping[idx].data_type
    }
    this.columnData = obj;
  }
  custom_sorting(key, data_type, order = 'asc') {
    var varA: any;
    var varB: any;
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0;
      }
      if (data_type == 'date') {
        varA = new Date(a[key]).getTime();
        varB = new Date(b[key]).getTime();
      }
      else {
        varA = (typeof a[key] === 'string') ? a[key].toUpperCase() : a[key];
        varB = (typeof b[key] === 'string') ? b[key].toUpperCase() : b[key];
      }
      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return (
        (order === 'desc') ? (comparison * -1) : comparison
      );
    };
  }

  dateChange(e) {
    //console.log(e);
  }

  getUniqueListBy(arr, key) {
    return [...new Map(arr.map(item => [item[key], item])).values()]
  }

  filterPlainArrayWithOR(data, arraycount) {
    var sorted_arr = data;
    var duplicate_arr = [];
    for (var i = 0; i < data.length - 1; i++) {
      if (sorted_arr[i + 1].case_id == sorted_arr[i].case_id) {
        duplicate_arr.push(sorted_arr[i].case_id);
      }
    }
    var unique = duplicate_arr.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });

    var matches = [];
    for (var i = 0; i < unique.length; ++i) {
      var id = unique[i];
      matches.push(data.filter(function (e) {
        return e.case_id == id;
      }))
    }
    var result = matches.filter(function (value, index, self) {
      return value.length == arraycount;
    })
    return result;
  }
  sorted_col_name: string;
  sorted_order: string;
  sorted_col_data_type: string;
  store_sort_object: any;
  receiveSortOrder(event) {
    this.store_sort_object = event;
    this.sorted_col_name = event.column_name;
    this.sorted_order = event.sort_order;
    this.sorted_col_data_type = event.data_type;
  }

  updateDisplayColumns(event) {
    if (event.column_order) {
      let column_order = event.column_order.filter(element => element.isChecked == true);
      this.displayedColumns = column_order.map(c => c.display_name);
      this.columnFilterInput = event.column_order;
    }
    else {
      this.filterArray.push(event);
      this.filter_data = event
      let unique_filter_array = this.getUniqueListBy(this.filterArray, 'column_name');
      // //console.log(unique_filter_array);
      if(this.bOrCon == 'builder'){
        let filters = [];
        TableTestData.data.files.forEach(item => {
          unique_filter_array.forEach(element => {
            if (element["data_type"] == 'string') {
              if (item[element["column_name"]].toLowerCase().includes(element["search_text"].toLowerCase())) {
                filters.push(item);
              }
              else if (element["search_text"] == '') {
                filters.push(item);
              }
            }
            if (element["data_type"] == 'number') {
              if (item[element["column_name"]] == element["equalTo"]) {
                filters.push(item);
              }
              else {
                if (element["equalTo"] == '' && element["less_than"] && item[element["column_name"]] < [element["less_than"]]) {
                  filters.push(item);
                }
                else if (element["equalTo"] == '' && element["greater_than"] && item[element["column_name"]] > [element["greater_than"]]) {
                  filters.push(item);
                }
                else if (element["equalTo"] == '' && element["greater_than"] == '' && element["less_than"] == '') {
                  filters.push(item);
                }
              }
            }
            if (element["data_type"] == 'date') {
              ////console.log(element);
              if (new Date(item[element["column_name"]]).getTime() == new Date(element["onDate"]).getTime()) {
                filters.push(item);
              }
              else {
                if (element["onDate"] == '' && element["beforeDate"] && new Date(item[element["column_name"]]).getTime() < new Date(element["beforeDate"]).getTime()) {
                  filters.push(item);
                }
                else if (element["onDate"] == '' && element["afterDate"] && new Date(item[element["column_name"]]).getTime() > new Date(element["afterDate"]).getTime()) {
                  filters.push(item);
                }
                else if (element["onDate"] == '' && element["afterDate"] == '' && element["beforeDate"] == '') {
                  filters.push(item);
                }
              }
            }
            if (element["data_type"] == 'boolean') {
              if (item[element["column_name"]] == element["boolean_value"]) {
                filters.push(item);
              }
              else if (element["boolean_value"] == '') {
                filters.push(item);
              }
            }
          })
        })

        if (unique_filter_array.length == 1) {
          if (this.sorted_order !== undefined && this.sorted_order.length) {
            let results = filters.sort(this.custom_sorting(this.sorted_col_name, this.sorted_col_data_type, this.sorted_order))
            ////console.log(filters.sort(this.custom_sorting(this.sorted_col_name, this.sorted_col_data_type, this.sorted_order)));
            this.dataSource = new MatTableDataSource<any>(results);
          }
          else {
            // //console.log(filters);
            this.dataSource = new MatTableDataSource<any>(filters);
          }
        }
        else {
          let result_array = [];
          for (let i = 0; i < this.filterPlainArrayWithOR(filters, unique_filter_array.length).length; i++) {
            result_array.push(this.filterPlainArrayWithOR(filters, unique_filter_array.length)[i][0]);
          }
          if (this.sorted_order !== undefined && this.sorted_order.length) {
            let results = result_array.sort(this.custom_sorting(this.sorted_col_name, this.sorted_col_data_type, this.sorted_order));
            // //console.log(result_array.sort(this.custom_sorting(this.sorted_col_name, this.sorted_col_data_type, this.sorted_order)));
            this.dataSource = new MatTableDataSource<any>(results);
          }
          else {
            // //console.log(result_array);
            this.dataSource = new MatTableDataSource<any>(result_array);
          }
          // //console.log(result_array.sort(this.custom_sorting(this.sorted_col_name, this.sorted_col_data_type, this.sorted_order)));
        }
      }
      if(this.bOrCon == 'consumer'){
        unique_filter_array.forEach(element => {
          if (this.sorted_order !== undefined) {
            if (element["column_name"] == this.sorted_col_name) {
              element["sort_order"] = this.sorted_order;
            }
            else {
              element["sort_order"] = '';
            }
          }
         })
        // //console.log(unique_filter_array);
        this.dataSource = new MatTableDataSource<any>(unique_filter_array);
      }
      if(this.bOrCon == 'view'){
        this.storeColumnMapping = this.componentProperties.column_mapping;
        this.maskEvent.mask(this.randomId, 'Loading...');

        this.getExceptions(1, this.numberofRecordsPerPage);
      }
    }
  }

  resetFilters(){
    this.resetFilteredData = true;
   // //console.log("reset");
    this.filterArray = [];
    this.dataSource = new MatTableDataSource<any>(TableTestData.data.files);

  }

  ngOnDestroy() {
    this.killTrigger.next();
    if(this.updatePreviewSub){
      this.updatePreviewSub.unsubscribe()
    }
  }

  getTags(e) {
    return e ? Object.keys(e) : [];
  }

  queueBtnClick(action_button, element, i) {
    if (this.bOrCon != 'builder') {
      if (action_button.btn_type == 'upload_file') {
        document.getElementById("rowUpload_" + i).click()
      }
      else if (action_button.btn_type == 'open_modal') {
        let componentUniqueId = action_button.api_url
        const oldScreenId = this.authService.getSelectedScreenid()
        this.authService.setSelectedParentId(oldScreenId);
        this.authService.setSelectedScreenid(componentUniqueId);

        let buttons_variables = {};

        if (action_button.variables && action_button.variables.length > 0) {
          action_button.variables.forEach(variable => {
            buttons_variables[variable.key] = variable.value;
          });
        }

        const global_params = action_button.params.split(",");
        // const global_params = ["case_id"]
        let obj = {}
        global_params.forEach(param => {
          param = param.trim();
          obj[param] = this.getParamValue(param, element)
        });

        this.dynamicPopServ.setPopUpView(true);

        this.valuesAndDependenciesStore.setGlobalVariables(obj)

        const dialogConfig = new MatDialogConfig();
        dialogConfig.panelClass = ["dynamicModalHeight"]
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.width = buttons_variables['width'] + "%";
        dialogConfig.height = buttons_variables['height'] + "%";
        dialogConfig.maxHeight = "90vh"
        dialogConfig.data = {
          screen_id: componentUniqueId
        };

        const dialogRef = this.dialog.open(GenerateDynamicPopupComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(result => {
          this.authService.setSelectedScreenid(oldScreenId);
          if (result) {
          }
        });
      }
      else {
        let params:any = {}
        this.service_call(action_button, params, element)
      }
    }
  }

  addRowFile(e, action_btn ,element) {
    const files: FileList = e.target.files;
    let blob_data = {}
    Object.keys(files).forEach(index => {
      this.changeToBlob(files[index]).subscribe((result) => {
        let fileObj = {};
        fileObj[files[index].name] = result;
        if(!blob_data[files[index].name]) {
          blob_data[files[index].name] = result
        } else {
          delete blob_data[files[index].name];
          blob_data[files[index].name] = result
        }
        if (Object.keys(files).length == Object.keys(blob_data).length) {
          let params = {}
          params['files'] = blob_data
          this.service_call(action_btn, params, element)
        }
      });
    });
  }

  changeToBlob(e, index?, name?) {
    const file = e;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    return Observable.create(observer => {
      reader.onloadend = () => {
        observer.next({blob: reader.result, name: name, index: index});
        observer.complete();
      };
    });
  }

  service_call(action_button, params, element) {
    params['queue_id'] = this.pathId;
    if (action_button.params) {
      let params_list = action_button.params.split(',');
      params_list.forEach(param => {
        params[param.trim()] = element[param.trim()]
      });
    }

    params.variables = {};

    if (action_button.variables && action_button.variables.length > 0) {
      action_button.variables.forEach(variable => {
        params.variables[variable.key] = variable.value;
      });
    }
    params.group = action_button.display_name;
    params.attachments = [];
    params.field_changes = {};
    params.search_filters = this.authService.getSelectedGlobalFilters();
    params.api_url = action_button.api_url
    params.btn_type = action_button.btn_type
    this.maskEvent.mask(this.randomId, 'Loading...');
    this.dataService.dynamicServiceCall(params).subscribe((resp) => {
      this.maskEvent.unMask(this.randomId);

      if(resp.flag){
          if (resp.message) {
            this.snackBar.open(resp.message, 'close', {
              duration: 5000,
            });
          }
        if (params.btn_type == 'download_file') {

        const downloadLink = document.createElement("a");
        const fileName = resp.data.file_name;

        let file_extension = fileName.split('.');
        file_extension = file_extension[file_extension.length - 1].toLowerCase();
        downloadLink.href = resp.data.blob;
        if (file_extension == 'xlsx' || file_extension == 'xls') {
          downloadLink.href = 'data:application/octet-stream;base64,'+resp.data.blob
        }
        else if (file_extension == 'pdf') {
          downloadLink.href = 'data:application/pdf;base64,' + resp.data.blob
        }
        else if (file_extension == 'doc' || file_extension == 'docx') {
          downloadLink.href = 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,' + resp.data.blob
        }
        downloadLink.download = fileName;
        downloadLink.click();
      }
      }

      if (resp.message) {
        this.snackBar.open(resp.message, 'close', {
          duration: 5000,
        });
      }
      this.maskEvent.mask(this.randomId, 'Loading...');
      this.getExceptions(this.startFile, this.endFile);
    });
  }

  getBtnColor(bgColor) {
    let color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    let r = parseInt(color.substring(0, 2), 16); // hexToR
    let g = parseInt(color.substring(2, 4), 16); // hexToG
    let b = parseInt(color.substring(4, 6), 16); // hexToB
    let uicolors = [r / 255, g / 255, b / 255];
    let c = uicolors.map((col) => {
      if (col <= 0.03928) {
        return col / 12.92;
      }
      return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    let L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
    return (L > 0.5) ? "#000000" : "#ffffff";
  }

  override runFieldLevelBusinessRule(formField, event_type?: any) {

    if (formField.rules_list && formField.rules_list.length > 0) {
      this.rules.evaluateRules(formField, event_type)
    }
  }


  getHeading(col:any){
    let new_headers = []
    if(this.componentProperties['card_initial_data'] && this.componentProperties['card_initial_data'].length > 0){
      for (let index = 0; index < this.componentProperties['card_initial_data'].length; index++) {
        new_headers.push(col[this.componentProperties['card_initial_data'][index]]);
      }
    }
    else{
      new_headers.push(col.case_id)
    }
    return new_headers.join(' ')
  }


  getData(){
    let updated_list = this.filterCard
    if(this.filterText){
      updated_list = updated_list.filter(o =>
       Object.keys(o).some(k => o[k] ? o[k].toLowerCase().includes(this.filterText) : ''));
      //  //console.log(updated_list)
    }

    return updated_list
  }

  highlight_cell(){
    if( this.view_card){
      this.view_card = false
    }
    else{
      this.view_card = true
    }
  }

  getcomments(comments){

    let comment
    try {
      comment = JSON.parse(comments || "[]")
    } catch (error) {
      comment = comments || []
    }

    comment.sort((left, right) => {
      return moment.utc(right.updated_on, 'MMMM DD YYYY, hh:mm a').diff(moment.utc(left.updated_on, 'MMMM DD YYYY, hh:mm a'))
    });

    return comment
  }


  showtile = 2
  changecardview(){
    if(this.showtile == 2){
      this.showtile = 1
    }
    else{
      this.showtile = 2
    }
  }

  getColValue(value){

    if(typeof value === "string"){

      if(value && value.indexOf('suspicious') > -1){
        value = value.replace(/suspicious/g, '')
      }


      if(value && value.indexOf('SUSPICIOUS') > -1){
        value = value.replace(/SUSPICIOUS/g, '')
      }

      if(value && value.indexOf('accurate') > -1){
        value = value.replace(/accurate/g, '')
      }
    }

    return value

  }

  selectAll() {
    this.additionalColumns.setValue(this.allColumns);
  }

  clearAll() {
    this.additionalColumns.setValue([]);
  }
}

