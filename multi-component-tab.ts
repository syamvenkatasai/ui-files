import { Component, OnInit, Input, ElementRef, HostListener } from '@angular/core';
import { DataService } from 'src/app/core/services/serviceBridge/data.service';
import { AuthService } from 'src/app/core/services/global/authentication.service';
import { MaskEventService } from 'src/app/core/services/mask-event.service';
import { DynamicComponentsInterfaceComponent } from '../dynamic-components';
import { ComponentStoreService } from 'src/app/core/services/component-store/component-store.service';
import { ValuesAndDependencyStoreService } from 'src/app/field-exception/service/values-dependencies-store.service';
import { BizrulesService } from 'src/app/core/services/businessrules/bizrules.service';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertPopupComponent } from 'src/app/shared/alert-popup/alert-popup.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BuilderStoreService } from 'src/app/core/services/serviceBridge/builder-store.service';

@Component({
  selector: 'app-generate-multi-component-tab',
  templateUrl: './generate-multi-component-tab.component.html',
  styleUrls: ['./generate-multi-component-tab.component.scss']
})
export class GenerateMultiComponentTabComponent extends DynamicComponentsInterfaceComponent implements OnInit {

  sourceScreenHeight = 880;
  sourceScreenWidth = 979;
  tabFields: Map<string, any[]> = new Map<string, any[]>();
  fields = [];
  tabs = [];
  duplicatedtabNames=[];
  form: FormGroup = new FormGroup({});
  selectedTab = new FormControl(0);
  gridColumns = "set-2"
  bOrCon: any
  currentClass:any
  tenantId
  randomId:any;
  selectedUnitsValue;
  oldValue;
  isChecked:any = false
  constructor(public dataService: DataService, private snackBar: MatSnackBar,private elRef: ElementRef,private dialog: MatDialog,
              private authService: AuthService, private builderStore: BuilderStoreService, private maskEvent: MaskEventService, private rules: BizrulesService,
    private componentStore: ComponentStoreService, private valuesAndDepsStore: ValuesAndDependencyStoreService) {
    super(componentStore, valuesAndDepsStore);
    this.authService.classtoAddSubject.subscribe((value) =>
    this.currentClass = value
    )
  }
  builderProperties:any = {}
  @Input() set builderOrConsumer(val) {
    if (this.bOrCon !== val) {
      this.bOrCon = val
      this.formTabInformation()
    }
  };
   @Input() set properties(val) {
    this.builderProperties = val
    this.generateByProp(val)
  }

  override ngOnInit() {
    this.authService.classtoAddSubject.next(this.authService.getCurrentTheme());
    if (this.bOrCon != "builder") {

      setTimeout(() => {
      this.runTabLevelBusinessRule('onload')
      },1000)

    }
    else{
    }

    this.randomId = this.authService.randomID(6);
    this.tenantId = this.authService.getTenantId();

    this.rules.tabname.subscribe(x => {
      this.componentProperties.component_unique_id = x.comp_id
      for(let i=0; i<this.componentProperties.tabs.length; i++){
        if(this.componentProperties.tabs[i]["tab_name"] === x.tabName){
          if(i< (this.tabs.length-1) && this.selectedTab.value != this.tabs.length){
            let set_tab = this.selectedTab.value
            this.selectedTab.setValue(++set_tab)
          }
          else{
            let set_tab = this.selectedTab.value
            this.selectedTab.setValue(--set_tab)
          }
        }
      }

    })



    this.formTabInformation();
    this.selectedTab.valueChanges.subscribe((value) => {
      this.authService.updateSpreadSheet.next({})
      let tab_name = this.componentProperties.childTabs[value]["tab_name"];

      this.authService.setSelectedTabName(tab_name);


      if (this.componentProperties["auto_save"]){

        this.authService.update_fields.next({});
      }
      this.tabClick(this.tabs[value])
      this.authService.setSelectedTabId(this.tabs[value])
      let fieldsData = this.valuesAndDepsStore.getMultiInfo()
      if (fieldsData){
        try{
          fieldsData[Object.keys(fieldsData)[0]]["edited_fields"] = this.valuesAndDepsStore.getEditedFields()
          fieldsData[Object.keys(fieldsData)[0]]["selected_units"] = JSON.stringify(this.valuesAndDepsStore.getSelectedUnitsObj())

        }catch(err){

        }

      }

       try{
        this.valuesAndDepsStore.setComponentCommonData(Object.values(fieldsData)[0])
      }catch(err){
       }

      let currentTabId = this.authService.getSelectedTabId()["stack_id"];
      for (let tab_id in this.valuesAndDepsStore.convertableData) {
        let tab = this.valuesAndDepsStore.convertableData[tab_id]; // Access the object using the key
        if (tab_id == currentTabId) {
          this.selectedUnitsValue = tab["selected_units"];
          this.oldValue = this.selectedUnitsValue;
          this.isChecked = tab["isChecked"];
          break;
        }
      }
      
    });

    this.authService.changeWidth.subscribe((value) => {
    //console.log(this.elRef.nativeElement.parentNode);
    if(value.view == "left"){
      this.elRef.nativeElement.closest('.component_size').style.width = '0px'
      this.elRef.nativeElement.closest('.component_size').style.left = '50%'

    }
    else if(value.view == "right"){
      this.elRef.nativeElement.closest('.component_size').style.width = '100%'
      this.elRef.nativeElement.closest('.component_size').style.left = '0px'


    }
    else{
      this.elRef.nativeElement.closest('.component_size').style.width = '50%'

      this.elRef.nativeElement.closest('.component_size').style.left = '50%'

      if (this.tenantId === "ambanketrade" && (this.authService.getSelectedQueueId() === 10 || this.authService.getSelectedQueueId() === 11)){
        this.elRef.nativeElement.closest('.component_size').style.left = '0px'

      }



    }
    })

    this.authService.updateSelectedUnits.subscribe(x => {

      let currentTabId = this.authService.getSelectedTabId()["stack_id"];
      for (let tab_id in this.valuesAndDepsStore.convertableData) {
        let tab = this.valuesAndDepsStore.convertableData[tab_id]; // Access the object using the key
        if (tab_id == currentTabId) {
          this.selectedUnitsValue = tab["selected_units"];
          this.oldValue = this.selectedUnitsValue;
          this.isChecked = tab["isChecked"];
          break;
        }
      }

    })
    
  }


  updateTabsFieldsInfo(){
    let fieldsData = this.valuesAndDepsStore.getMultiInfo()
    this.valuesAndDepsStore.setComponentCommonData({})
    let selectedTabs =  this.authService.getSelectedTabId()
    let selectedTabName
    if (selectedTabs){
      selectedTabName = selectedTabs["tab_name"]
      if (this.duplicatedtabNames.includes(selectedTabName)) {
        this.valuesAndDepsStore.setComponentCommonData({});
      } else {
        this.valuesAndDepsStore.setComponentCommonData(Object.values(fieldsData)[0][selectedTabName]);
      }
    }

    // console.log("Selected tab name:", selectedTabName);

    console.log(Object.values(fieldsData)[0][selectedTabName])
    this.authService.updateSummaryTable.next({})
    this.authService.updateJsonFields.next({})
    this.authService.updateSpreadSheet.next({})
  }

  override checkDependencyTypeandExecute(dependencyName) {
    switch(dependencyName) {
      case "load_component":
      this.formTabInformation();
      break;
    }
  }

  generateByProp(v) {
    if (v && v.tabs && this.compareTabArray(this.tabs, v.tabs)) {
      this.tabs = v.tabs
    }
  }

  compareTabArray(a, b) {
    if (JSON.stringify(a) === JSON.stringify(b)) {
      return false
    }
    return true
  }

  formTabInformation() {
    //builder
    if(this.bOrCon == "builder"){
      this.tabs = [{"tab_name": "Tab 1"}, {"tab_name": "Tab 2"}]
    }
    else {
      this.gridColumns = `set-${this.componentProperties.grid_columns || 2}`
      this.tabs = [];
      this.componentProperties.childTabs = this.componentProperties.childTabs || this.componentProperties.tabs
      this.componentProperties.childTabs.forEach(element => {
        if (element['display'] == undefined || element['display'] == true) {
          this.tabs.push(element)
        }
      });
      let tab_index = this.componentProperties.childTabs.findIndex(x => (x['display'] == undefined || x['display'] == true) && (x['disable'] == undefined || x['disable'] == false));
      this.authService.setSelectedTabId(this.tabs[tab_index])
      if((this.authService.getSelectedQueueId() === 10 || this.authService.getSelectedQueueId() === 11) &&  this.authService.getTenantId() === 'ambanketrade'){
        this.updateTabsFieldsInfo()
      }
    }
  }

  getTabs() {
    if(this.bOrCon == "builder"){
      return [{"tab_name": "Tab 1"}, {"tab_name": "Tab 2"}]
    }
    else{
      let list__ = [];
      this.tabs = [];
      this.componentProperties.childTabs = this.componentProperties.childTabs || this.componentProperties.tabs
      let sortedtabs = this.componentProperties["tabs_Order"]
      let sortingArr = []
      let updatedSortingList = []
      if(sortedtabs){
        sortingArr =  sortedtabs.split(',')
        for (let i = 0; i < sortingArr.length; i++) {
          const element = sortingArr[i].replaceAll(' ','');
          updatedSortingList.push(element)
        }
      }
      let newArray = this.componentProperties.childTabs.sort(function(a, b){
        return updatedSortingList.indexOf(a["stack_id"]) - updatedSortingList.indexOf(b["stack_id"]);
      });
      // console.log(newArray)
      newArray.forEach(element => {
        if (element['display'] == undefined || element['display'] == true) {
          list__.push(element)
          this.tabs.push(element)
          list__ = [...list__, ...this.tabs.filter(tab => tab.tab_name.includes('sub_stack_'))];
        }
        return this.tabs;
      });
      return list__
    }
  }

  getTabEnableDisable(tab) {
    if (tab['disable'] == undefined || tab['disable'] == true) {
      return false;
    }
    else {
      return true;
    }
  }

  getTabComponents(tabname) {
    return this.componentProperties.tab_children[tabname]
  }

  refactorSize(measureType: string, item: any) {
    if(measureType === 'width' || measureType === 'left') {
      const screenWidth = item.parent ? document.getElementById(item.parent).clientWidth : window.screen.width;
      return (item[measureType]  * (screenWidth / item['source_width']))
    } else {
      const screenHeight = item.parent ?  document.getElementById(item.parent).clientHeight : window.screen.height
      return (item[measureType] + 20  * (screenHeight / item['source_height']))
              // + 20 is to cover up the margin top
    }
  }

  checkComponentsWithNoChild(uniqueid) {
    return this.getComponent(uniqueid) !== 'columns_component' && this.getComponent(uniqueid) !== 'grouped_component_tab'
  }

  getComponent(uniqueid) {
    return this.componentStore.getSpecificQueueComponent(uniqueid) ? this.componentStore.getSpecificQueueComponent(uniqueid).item_type : 'notfound'
  }

  getComponentProps(uniqueid, tab_id) {
    try {
      let objProps = this.componentStore.getSpecificQueueComponent(uniqueid)
      objProps.tab_id = tab_id
      return objProps

    } catch (error) {
      return {}
    }
  }

  getBlockWidth() {
    return 100
  }

  getBlockHeight() {
    return 100
  }

  runTabLevelBusinessRule(event_type?: any) {

    if (this.componentProperties.rules_list && this.componentProperties.rules_list.length > 0) {
      this.rules.evaluateRules(this.componentProperties, event_type)
    }
  };


  tabClick(tabsData){
    this.valuesAndDepsStore.setUniqueName("");

    this.authService.DestroyAreas()
    if (this.componentProperties.rules_list && this.componentProperties.rules_list.length > 0) {
      this.rules.evaluateRules(this.componentProperties, "change")
    }
    let get_page;

    if( this.authService.getTenantId() === 'ambanketrade' ||  this.authService.getTenantId() === 'ambankdisbursement'){

      if(tabsData.tab_name == "Additional Files"){
        this.authService.createAdditionalFiles({"flag":true ,"url":this.componentProperties.url,"tabname":tabsData.tab_name})
      }
      else{
        this.authService.createAdditionalFiles({"flag":false,"url":this.componentProperties.url,"tabname":tabsData.tab_name})
      }


    }


    setTimeout(() => {
      if(tabsData.tab_navigation_check == "true"){
        this.authService.callTabsFunction.next({tabname:tabsData.tab_name})
      }
    }, 100);



}

duplicateAndDisplayTab() {
  const currentTabIndex = this.selectedTab.value;
  const tabs = this.getTabs();
  if (currentTabIndex < 0 || currentTabIndex >= tabs.length) {
    console.error("Invalid current tab index");
    return;
  }
  const currentTab = tabs[currentTabIndex];
  const currentTabName = currentTab.tab_name;
  const currentTabId = currentTab.stack_id;
  const currentTabComponents = this.componentProperties.tab_children[currentTabId];
  console.log("current tab components: ", currentTabComponents);
  console.log("tab length:", tabs.length);
  const updatedIndex = tabs.length +1;
  console.log("updated index:", updatedIndex);
  const stackindex = updatedIndex - 1;
  const duplicatedTabStackId = `sub_stack_${stackindex}`;
  console.log("duplicated stack id:", duplicatedTabStackId);
  const duplicatedTabName = `${currentTabName.split('_')[0]}_${updatedIndex}`;
  console.log("duplicated tab name:", duplicatedTabName);
  this.duplicatedtabNames.push(duplicatedTabName);
  console.log("duplicated tab names:", this.duplicatedtabNames);
  const duplicatedTab = {
    stack_id: duplicatedTabStackId,
    tab_name: duplicatedTabName,
    tab_navigation_check: 'true'
  };

  const duplicatedTabComponents = Object.values(currentTabComponents);
  tabs.push(duplicatedTab);
  console.log(duplicatedTab);
  this.componentProperties.childTabs = this.componentProperties.childTabs || this.componentProperties.tabs;
  (this.componentProperties.childTabs as { tab_name: string; stack_id: string; tab_navigation_check: string}[]).push(duplicatedTab);

  this.componentProperties.tab_children[duplicatedTabStackId] = duplicatedTabComponents;
  (this.componentProperties.tabs as { tab_name: string; stack_id: string; tab_navigation_check: string}[]).push(duplicatedTab) ;
  console.log("tabs are  my tabs:",this.componentProperties.tabs);
  console.log("properties are:", this.componentProperties);


  console.log("All tabcomponents:", this.componentProperties.tab_children);
  console.log("getting the tabs", this.getTabs());
  let params = {}

  params["mesh_layout"] = this.componentProperties.tab_children
  params["component_unique_id"] = this.componentProperties.component_unique_id

  let properties = {...this.componentProperties}
  delete properties.formgroup

  params["component_Properties"]=properties
  params["tab_Name"]=this.duplicatedtabNames
  params["queue_id"] = this.authService.getSelectedQueueId()
  this.dataService.addTabChildren(params).subscribe((resp: any) => {

    if(resp.flag){
      console.log("updated")
    }
    else{
      this.snackBar.open("Something went wrong", 'close', {
                duration: 5000,
      });
    }

  }),(error) => {
    this.snackBar.open("Something went wrong", 'close', {
      duration: 5000,
});
    }
    const screen_id = this.authService.getSelectedScreenid();
    const components=this.componentStore.queueComponents;
    console.log("All tab components:", this.componentStore.queueComponents);
  }

@HostListener('document:keydown', ['$event'])
handleKeyDown(event: KeyboardEvent) {
   if(event.shiftKey ){
      if(event.keyCode == 9){
      //console.log(this.tabs[1],this.selectedTab)
      if(this.selectedTab.value < (this.tabs.length-1) && this.selectedTab.value != this.tabs.length){
        let set_tab = this.selectedTab.value
        this.selectedTab.setValue(++set_tab)
      }
      else{
        this.selectedTab.setValue(0)
      }
    }
   }


}

addbtn(){
  let selectedTabs =  this.authService.getSelectedTabId()
  let selectedTabName = ""
  if (selectedTabs){
    selectedTabName = selectedTabs["tab_name"]
  }

  const excludedTabs:String[]=["Additional Files","Summary","Multi Summary","Application Form_1", "BA Draft_1","Data Input"];
  if((this.authService.getSelectedQueueId() === 10 || this.authService.getSelectedQueueId() === 11) && this.authService.getTenantId() === 'ambanketrade' && !excludedTabs.includes(selectedTabName)){
    return true
  }
  else{
    return false
  }
}

isObject(value) {
  return typeof value === 'object' && value !== null && !(Object.keys(value).length === 0 && value.constructor === Object);
}
updateUnits(conversionFactor: string,isConvertingFromCheckbox:any) {


  let currentTabId = this.authService.getSelectedTabId()["stack_id"];
  for (let tab_id in this.valuesAndDepsStore.convertableData) {
   
    if (tab_id == currentTabId) {

      this.valuesAndDepsStore.convertableData[tab_id]["selected_units"] = this.selectedUnitsValue;
      break;
    }
  }


  this.selectedUnitsValue=conversionFactor;
  this.valuesAndDepsStore.setConversionFactor(this.selectedUnitsValue)
  this.valuesAndDepsStore.convertUnits(this.oldValue,conversionFactor,this.isChecked,isConvertingFromCheckbox);
  this.oldValue = conversionFactor;
}

convertToMillions(){
  this.valuesAndDepsStore.convertAllFieldsToMillions();
}

onChecked(event:any){
  const inputElement = event.target as HTMLInputElement;
  this.isChecked = inputElement.checked;
  let reqSelectedUnits = this.selectedUnitsValue;

  for(let tab_id in this.valuesAndDepsStore.convertableData){
    let item = this.valuesAndDepsStore.convertableData[tab_id];
    if (item["isChecked"] == this.isChecked) {
      reqSelectedUnits = item["selected_units"];
      break;
    }

  }

    let currentTabId = this.authService.getSelectedTabId()["stack_id"];
    for (let tab_id in this.valuesAndDepsStore.convertableData) {
      let tab = this.valuesAndDepsStore.convertableData[tab_id]; // Access the object using the key
      if (tab_id == currentTabId) {
        this.selectedUnitsValue = reqSelectedUnits;

        this.valuesAndDepsStore.convertableData[tab_id]["selected_units"] = this.selectedUnitsValue;
        this.valuesAndDepsStore.convertableData[tab_id]["isChecked"] = this.isChecked; 
        this.updateUnits(this.selectedUnitsValue,true);
        break;
      }
    }




}
}


