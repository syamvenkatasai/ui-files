import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormConfig } from 'src/app/field-exception/model/form-config';
import { AuthService } from 'src/app/core/services/global/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/core/services/serviceBridge/data.service';
import { FormGroup } from '@angular/forms';
import { ButtonType } from 'src/app/field-exception/model/button-model';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { GeneratePopupComponent } from '../generate-popup/generate-popup.component';
import { ComponentStoreService } from 'src/app/core/services/component-store/component-store.service';
import { ValuesAndDependencyStoreService } from 'src/app/field-exception/service/values-dependencies-store.service';
import { Subject } from 'rxjs';
import { ComponentModel } from 'src/app/field-exception/model/component-model';
import { MaskEventService } from 'src/app/core/services/mask-event.service';
import { DynamicPopupService } from '../generate-dynamic-popup/dynamic-popup.service';
import { NavtabService } from 'src/app/core/services/navtab.service';

declare var $: any;

interface InnerData {
  [key: string]: {
      [key: string]: string;
  };
}

@Component({
  selector: 'app-quandrant-basis-form',
  templateUrl: './quandrant-basis-form.component.html',
  styleUrls: ['./quandrant-basis-form.component.scss']
})
export class QuandrantBasisFormComponent implements OnInit, OnDestroy {

  sourceScreenHeight = 880;
  sourceScreenWidth = 979;
  mesh_layout = [];
  components = {};
  dropdownValues= {};

  componentList = [];
  form: FormGroup = new FormGroup({});
  screenpath = "";

  bg_type = "none"
  screen_bg = ""
  screen_bg_opacity = 50;
  screen_bg_color = "#ffffff"

  isModalView = false
  isRightViewActive=false;
  tenant_id:any


  @Input()
  set modalHeight(val) {
    this.isModalView = val;

  }
  currentClass:any
  constructor(private dynamicPopServ: DynamicPopupService, private authService: AuthService, private route: ActivatedRoute,
              private dataService: DataService, private dialog: MatDialog, private maskEvent: MaskEventService,
              private componentStore: ComponentStoreService, private valueAndDepsStore: ValuesAndDependencyStoreService,private navtabService:NavtabService) {
                this.authService.classtoAddSubject.subscribe((value) =>
   this.currentClass = value
   )
  }

  randomId = ""
  updatePreviewSub: any;
  updateSliderSub: any;
  updateFieldsSub:any;
  openslider
  sliderData
  oldScreenId
  audit_response = []
  show_btn = false
  auditSubscription
  ngOnInit() {

    this.auditSubscription=this.authService.showAudit.subscribe(x => {
      this.show_btn  = x
      // console.log("---------------")
      // console.log(this.show_btn)
      this.showAudit()
    })

    this.authService.setSelectedGlobalFilters({})

    this.authService.isRightViewActive$.subscribe((isActive) => {
      this.isRightViewActive = isActive;
    });
    this.tenant_id = this.authService.getTenantId();

    this.authService.classtoAddSubject.next(this.authService.getCurrentTheme());
    this.randomId = this.authService.randomID(6);
    this.maskEvent.mask(this.randomId, 'Loading..');
    this.authService.setActivatedRoute(this.route);
    this.screenpath =  this.authService.getSelectedScreenid();
    this.loadComponents();
    this.updatePreviewSub =  this.authService.update_preview.subscribe(x => {
      this.getFields()
    })

    this.updateFieldsSub = this.authService.update_fields.subscribe(value => {
      this.getFields();

    });


    this.authService.loadQueueComps.subscribe(data => {
      this.loadComponents();
    })


    this.updateSliderSub = this.valueAndDepsStore.showrightslider.subscribe(data => {

      this.oldScreenId = this.authService.getSelectedScreenid()
      this.authService.setSelectedParentId(this.oldScreenId);
      this.authService.setSelectedScreenid(data.componentUniqueId);

      this.sliderData = data
      this.openslider =  true
    })



    setTimeout(() => {
      this.audit_response = this.valueAndDepsStore.getauditresponse()
      if(this.audit_response){
        // console.log(this.audit_response)
        // if(this.audit_response.length > 0){
        //   this.authService.showAudit.next(true)
        // }
      }
    }, 500);

    if(this.audit_response){
      console.log(this.audit_response)
    if(this.audit_response.length > 0){
      setTimeout(() => {
        this.authService.showAudit.next(true)
      }, 1000);
    }
  }
  }


  showAudit(){
    return this.show_btn
  }

  loadComponents() {
    const paramObj = {queue_id: this.authService.getSelectedQueueId(), screen_id: this.screenpath};
    this.dataService.getComponentsOfQueue(paramObj).subscribe(
      response => {
        this.maskEvent.unMask(this.randomId);
        if (response.flag) {
          this.mesh_layout = response.mesh_layout;
          this.components = response.components;
          this.findModifiables(this.mesh_layout);

          if (this.components && this.components['_screen_prop']) {
            this.bg_type = this.components['_screen_prop'].bg_type
            this.screen_bg = this.components['_screen_prop'].background
            this.screen_bg_opacity = this.components['_screen_prop'].opacity
            this.screen_bg_color = this.components['_screen_prop'].bg_solid_color
          }
          this.dropdownValues = response.dropdown_values;
          if(response.dropdown_values) {
            this.valueAndDepsStore.setQueueDropdownValues(this.authService.getSelectedQueueId(), response.dropdown_values)
          }
          this.getMultiComponents();
          this.pushUniqueIDtoObject();
          this.componentList = Object.keys(this.components);

          this.authService.updatePreviewData()

          setInterval(() => {
            this.checkHiddenComponent()
          }, 1000)
        }
      },
      (error) => {
        this.maskEvent.unMask(this.randomId);
      });
  }

  findModifiables(mesh_layout:any){
    let all_components:any;
    let req_data = {};
    for(let i=0;i<mesh_layout.length;i++){
      if(mesh_layout[i]["componentType"] == "multi_component_tab"){
        all_components = mesh_layout[i]["children"];
        for(let tab_id in all_components){
          req_data[tab_id] = {
            source:[],
            selected_units:1,
            isChecked:false,
            hasMultipleDropdownOptions:false
          };
          let hasMultipleDropdownOptions=[];
          for(let item of all_components[tab_id]){
            if(item["componentType"] == "json_based_fields"){
              let source = item["properties"]["source"];
              req_data[tab_id]["source"].push(source);
              if(hasMultipleDropdownOptions.length>0){
                req_data[tab_id]["hasMultipleDropdownOptions"] = true;
              }
              hasMultipleDropdownOptions.push("json_based_fields");

            }else {
              let source = item["properties"]["source"];
              let variables = item["properties"]["variables"];
              if(variables && variables.length>0){
                for(let variable of variables){
                  if(variable["key"] == "select_units" && variable["value"] == "True"){
                    req_data[tab_id]["source"].push(source);
                    hasMultipleDropdownOptions.push(source);
                    if(hasMultipleDropdownOptions.includes("json_based_fields")){
                      req_data[tab_id]["hasMultipleDropdownOptions"] = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log("______________________");
    console.log(req_data);
    this.valueAndDepsStore.setConvertableData(req_data);
  }

  pushUniqueIDtoObject() {
    Object.keys(this.components).forEach(componentid => {
      let componentProps : ComponentModel = this.components[componentid];
      componentProps.component_unique_id = componentid;
      componentProps.formgroup = this.form;
      componentProps.queue_id = this.authService.getSelectedQueueId();
      let executeDependency: Subject<any> = new Subject<any>();
      componentProps.executeDependency = executeDependency;

      if(componentProps.item_type === 'search_dropdown_field_component' ||
        componentProps.item_type === 'dropdown_field_component') {
          componentProps.dropdownData = this.dropdownValues ? this.dropdownValues[componentid] : {}
        }
      if(componentProps.item_type === 'file_tab') {
        let enableCropToSelectValue: Subject<any> = new Subject<any>();
        let enableRubberBanding: Subject<any> = new Subject<any>();
        componentProps.enableCropToSelectValue = enableCropToSelectValue;
        componentProps.enableRubberBanding = enableRubberBanding;
      }
    });
  }

  multi_components = []

  getMultiComponents() {
    this.multi_components = []
    Object.keys(this.components).forEach(componentid => {

      if (this.components[componentid].item_type == 'multi_component_tab' || this.components[componentid].item_type == 'grouped_component_tab') {
        this.components[componentid].id = componentid
        let index_ = this.mesh_layout.findIndex(x => x.id === componentid)
        if (index_ > -1 && this.mesh_layout[index_].children) {
            Object.keys(this.mesh_layout[index_].children).forEach(subcompid => {
            if( this.mesh_layout[index_].children && this.mesh_layout[index_].children[subcompid]){
              for (let i = 0; i < this.mesh_layout[index_].children[subcompid].length; i++) {
                this.components[this.mesh_layout[index_].children[subcompid][i].id].tab_children = this.mesh_layout[index_].children[subcompid][i].children
              }
            }
          })
        this.components[componentid].tab_children = this.mesh_layout[index_].children
        }
        this.multi_components.push(this.components[componentid])
      }
    });

    this.findParentComponent()
  }

  findParentComponent() {
    this.multi_components.forEach(comp => {
      // console.log(comp.tab_children)
      if(comp.tab_children){

        for (const tab_obj in comp.tab_children) {

          comp.tab_children[tab_obj].forEach(x => {

            if(this.components[x.id]){

              this.components[x.id].parent = comp.id
              x.properties.parent = comp.id
            }


          });
        }
      }
    });
    this.componentStore.setQueueComponents(this.screenpath, this.components)
  }



  refactorSize(measureType: string, item: any) {
    const screenWidth = item.parent ? this.components[item.parent].width : document.getElementById('getwidth').clientWidth;
    const screenHeight = item.parent ? this.components[item.parent].height : document.getElementById('getwidth').clientHeight;

    if(measureType === 'width' || measureType === 'left') {
      return (item[measureType]  * (screenWidth / item['source_width']))
    }
    else {
      return (item[measureType]  * (screenHeight / item['source_height']))
    }
  }

  getHeight() {
    if (this.isModalView) {
      return $(".dynamicModalHeight").height() + "px"
    }
    return ""
  }

  unLock() {
    const params = {
      case_id: this.valueAndDepsStore.getCaseId(),
      time_spent: '123123123',
      username: this.authService.getUserName()
    };
    this.dataService.unLockFile(params).subscribe((resp) => {}, (error) => {});
  }

  checkHidden(value) {
    return value
  }

  showPopup(componentUniqueId) {
    const paramsObj: any = {};
    paramsObj.case_id = this.valueAndDepsStore.getCaseId();
        const dialogConfig = new MatDialogConfig();

        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.maxHeight = 'calc(100vh - 75px)';
        dialogConfig.width = '90%';
        dialogConfig.maxWidth = '90vw'
        dialogConfig.data = {}

        const dialogRef = this.dialog.open(GeneratePopupComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(result => {
          if (result) {}
        });
  }

  checkComponentsWithNoChild(uniqueid) {
    return this.getComponent(uniqueid) !== 'multi_component_tab' && this.getComponent(uniqueid) !== 'columns_component'  && this.getComponent(uniqueid) !== 'grouped_component_tab'
  }

  getComponent(uniqueid) {

    return this.components[uniqueid] ? this.components[uniqueid].item_type : 'notfound'
  }

  getBlockWidth() {
    return 100/this.mesh_layout[0].length
  }

  getBlockHeight() {
    return document.getElementById('left-nav-tab').clientHeight / 8;
    // return 180/this.mesh_layout.length
  }

  checkRequiredComps(unique_name) {
    return this.components[unique_name].item_type === 'queue_list' ||
            this.components[unique_name].item_type === 'file_tabs_component' ||
              this.components[unique_name].item_type === 'buttons_grid'
  }

  checkStatsTypeComp(unique_name) {
    return this.components[unique_name].item_type === 'string_type_cards_component' ||
            this.components[unique_name].item_type === 'text_type_cards_component' ||
              this.components[unique_name].item_type === 'chart_type_cards_component' ||
              this.components[unique_name].item_type === 'click_type_cards_component' ||
            this.components[unique_name].item_type === 'table_type_cards_component' ||
              this.components[unique_name].item_type === 'flip_type_cards_component'
  }

  getBgColor() {
    if (this.bg_type === 'solid') {
      return this.screen_bg_color
    }
    else {
      return 'transparent'
    }
  }

  getComponentProp(id) {
    return this.components[id]
  }

  checkHiddenComponent() {
    let comps = this.componentStore.getQueueComponents()
    for (const key in comps) {
      if (document.getElementById(key)) {
        if (comps[key].hidden) {
          document.getElementById(key).style.display = "none"
        }
        else {
          document.getElementById(key).style.display = "block"
        }
      }
    }
  }

  getFields() {
    let params: any = {}
    params.queue_id = this.authService.getSelectedQueueId();
    params.case_id = this.valueAndDepsStore.getCaseId();
    if (this.tenant_id === 'dentsu'){
      if (!params["case_id"]){
        return 
      }
    }
    params['role'] = this.authService.getUserRole();
    params.url = 'get_fields'

    try {
      params.claim_id = this.componentStore.getQueueComponents()['_screen_prop'].formgroup.get('claim_id').value;
    } catch (error) {

    }

    if (this.tenant_id === 'kmb' || this.tenant_id === 'hdfc'){
      this.maskEvent.mask(this.randomId, 'Loading...')
    }

    if (this.tenant_id === "ambanketrade"  && this.authService.getSelectedQueueId() === 24){
      params.tab_type = "calculations"
    }
  


    this.dataService.getFieldValue(params).subscribe((resp: any) => {
      // if (resp.flag) {
      //   if (resp.highlight) {
      //     this.valueAndDepsStore.highLightFields[this.valueAndDepsStore.getCaseId()] = resp.highlight
      //   }
      //   this.authService.updateFormValues.next(resp)
      // }
      if (this.tenant_id === 'kmb' || this.tenant_id === 'hdfc'){
        this.maskEvent.unMask(this.randomId);
      }

      if (resp.flag) {

          // this.authService.run_biz_rule.next({})
          // let isAuditTrailNeedToShow = this.valueAndDepsStore.getAuditTrailState()
          // if(isAuditTrailNeedToShow){
          //     this.dataService.auditDetails(params).subscribe(response => {
          //       if (response.flag) {
          //         this.audit_response = response['nodes'];
          //         this.valueAndDepsStore.setauditresponse(this.audit_response)
          //         // setTimeout(() => {
          //           this.authService.showAudit.next(true)
          //         // }, 1000);
          //       }
          //     })
          //   }

        this.valueAndDepsStore.setDeletedFiles(resp.deleted_files)
        this.valueAndDepsStore.setFailureData(resp.failures)

        if (resp.highlight) {
          this.valueAndDepsStore.highLightFields[this.valueAndDepsStore.getCaseId()] = resp.highlight
          if (this.valueAndDepsStore.selectedField) {
            const component: ComponentModel = this.componentStore.getSpecificQueueComponentBasedOnType("file_tab");
            if (component && component.item_type) {
              component.enableRubberBanding.next(this.valueAndDepsStore.selectedField)
            }
          }
        }


        
        if(resp.data){

          
          this.authService.updateFormValues.next(Object.values(resp.data)[0])
          const values = Object.values(resp.data)[0];
          let selectedUnits = values["selected_units"]
          if(selectedUnits){
            try{
              this.valueAndDepsStore.convertableData = JSON.parse(selectedUnits);
            }catch(err){
              this.valueAndDepsStore.convertableData = selectedUnits;
            }
            
          }
          let unsubscribedFields = [];
          try{
            try{
               unsubscribedFields  = JSON.parse(values['unsubscribed_fields']);
            }catch(e){
               unsubscribedFields  = values['unsubscribed_fields'] || [];
            }
 
          }catch(e){
             unsubscribedFields = [];
 
          }
          this.valueAndDepsStore.storeUnsubscribedFields(unsubscribedFields);
          if(values["user_trained_highlights"]){
            try{
              this.valueAndDepsStore.trainedHighLightFields[this.valueAndDepsStore.getCaseId()] = JSON.parse(values["user_trained_highlights"]);
            }catch(e){
              this.valueAndDepsStore.trainedHighLightFields[this.valueAndDepsStore.getCaseId()] = values["user_trained_highlights"];
            }

          }else{
            this.valueAndDepsStore.trainedHighLightFields[this.valueAndDepsStore.getCaseId()] = {};
          }
          if(values["user_trained_data"]){
            try{
              this.valueAndDepsStore.headerContextData = JSON.parse(values["user_trained_data"]);
            }catch(e){
              this.valueAndDepsStore.headerContextData = values["user_trained_data"];
            }

          }else{
            this.valueAndDepsStore.headerContextData = {};
          }
        }
    }


  })
  }
  closeSliderComp() {
    this.openslider = false
    this.authService.setSelectedScreenid(this.oldScreenId);
  }

  ngOnDestroy(): void {
    this.updatePreviewSub.unsubscribe()
    this.updateSliderSub.unsubscribe()
    this.updateFieldsSub.unsubscribe()
    this.auditSubscription.unsubscribe()
  }
  expanded = false;
  displayed_icon = "keyboard_arrow_down"
  isAuditTrailOpened = false;
  showNetwork() {
    this.isAuditTrailOpened = !this.isAuditTrailOpened;

    // Notify other components about the state change
    this.navtabService.setAuditTrailOpened(this.isAuditTrailOpened);
    if(this.expanded){

      this.displayed_icon = "keyboard_arrow_down"
    }
    else{
      this.displayed_icon = "keyboard_arrow_up"
    }
    this.expanded = !this.expanded;
    setTimeout(() => {
      const elem: HTMLElement = document.getElementById('selected_network_queue');
        this.moveToTarget(elem);
    }, 1000);
  }


  moveToTarget(target: HTMLElement) {
    target.scrollIntoView({behavior: 'smooth', block: 'end'});
  }

  getbackground(itemType){
    let type = itemType.properties.item_type
    if(type == "queue_list" || type == "file_tab" || type == 'multi_component_tab' || type == 'grouped_component_tab'){
      // console.log("in")
      return "#fff"
    }
    else{
      return ""
    }
  }
}
