import {DatePipe, NgForOf} from '@angular/common';
import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, Renderer2} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, timer} from 'rxjs';
import {MaskEventService} from 'src/app/core/services/mask-event.service';
import {DataService} from 'src/app/core/services/serviceBridge/data.service';
import { AuthService } from 'src/app/core/services/global/authentication.service';
import { configuration_details } from 'src/confiig';

@Component({
  selector: 'app-moniter-stats',
  templateUrl: './moniter-stats.component.html',
  styleUrls: ['./moniter-stats.component.scss']
})
export class MoniterStatsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('dateInput') dateInput: any;
  chartData: any = {};
  dt: any;

  maxFilters = 2

  dateitems = [
    {value: 'Today', viewValue: 'Today'},
    {value: 'Past Week', viewValue: 'Past Week'},
    {value: 'Past 30 Days', viewValue: 'Past 30 Days'},
    // {value: 'All Time', viewValue: 'All Time'},
    {value: 'Any Time', viewValue: 'Any Time'}
  ];
  selectedDate = 'Today';
  
  fromDate = '';
  fromDate_text = '';
  toDate = '';
  toDate_text = '';
  anyTimeFromDate: any;
  anyTimeToDate: any;
  private killTrigger: Subject<void> = new Subject();
  getStatsRespReceived = false;
  firstCall = true;
  filterDropdowns = {};
  dropdownData = {};
  settingsSelected = false;
  scale = 'week';
  maxStatsDate = new Date();

  showMoreFilters = false;
  showMoreFiltersView = false;
  selected_dropdown_value=""

  otherFiters = [];

  filter_options = {};
  filter_changed_data = {};
  obj={};
  hide_filters:any;

  hostname
  currentClass:any;


  constructor(
      private dataService: DataService, private maskEvent: MaskEventService,
      private router: Router, private route: ActivatedRoute,
    private datepipe: DatePipe, private cd: ChangeDetectorRef, private authService: AuthService, private renderer : Renderer2) {
      this.authService.classtoAddSubject.subscribe((value) =>
   this.currentClass = value
   )
    }

  randomId = ""
  ngOnInit() {
    this.authService.classtoAddSubject.next(this.authService.getCurrentTheme());
    this.randomId = this.authService.randomID(6)
    this.hostname = this.authService.getTenantId();
    if (configuration_details.tenant_id == 'cpf') {
      this.selectedDate = 'Past Week';
    }
    if (this.hostname === 'indusindemailpoc'){
      this.selectedDate = 'Past Week'
    }
    this.obj={}
    // this.obj={
    //   selectedFilters: this.dropdownData,
    //   fromDate: fDate,
    //   toDate: tDate,
    //   filters:this.filtersSelected,
    // };
    const fdate =  new Date();
    const tdate = new Date();
    // yyyy - MM - dd
    this.fromDate = this.generateDateFormat(fdate);
    this.toDate = this.generateDateFormat(tdate);
    this.dataService.getSegmentDetails(this.obj).subscribe(
      resp => {

        
        this.hide_filters=resp["hide_filters"]
        console.log(this.hide_filters)
        // this.getStatsRespReceived = true;
        this.maskEvent.unMask(this.randomId);
        // this.chartData = resp.data;
        // this.dropdownData = resp['dropdown_data'];
        // this.filterDropdowns = resp['default_dropdown_options'];
        // if (this.firstCall) {
        //   this.filtersSelected = {...this.filterDropdowns}
        // }
        // this.otherFiters = resp["data"]['Filters'][0]["options"] ? resp["data"]['Filters'][0]["options"] :[]
        // this.firstCall = false;
        this.otherFiters = resp['Filters'] ? resp['Filters'] :[]
        if (resp.data && resp.data.length > 0) {
          resp.data.forEach(element => {
            element.manualrefresh = false;
          });
        }
        if (this.authService.getTenantId() === "wipro"){
          let latestDate=resp["Filters"][1]["options"].length-1
          this.filterChange(resp["Filters"][0]["options"][0], resp["Filters"][0]);
          this.filterChange(resp["Filters"][1]["options"][latestDate], resp["Filters"][1]);
        }
        
      },
      
      (error) => {
        this.maskEvent.unMask(this.randomId);
    });
    

    
    this.refreshStats();
    // for (let i = 0; i < this.otherFiters.length; i++) {
    //   this.filter_changed_data[this.otherFiters[i].name] = '';
    // }
    // this.getFilterOptions()
    // this.getCardsStatsData('', '');

    
  }

  getFilterOptions() {
    for (let i = 0; i < this.otherFiters.length; i++) {
      const element = this.otherFiters[i];
      let params: any = {}
      params.route = element.route;
      this.dataService.getFilterOptions(params).subscribe(resp => {
        if (resp.flag) {
          this.filter_options[element.name] = resp.data
        }
        else {
          this.filter_options[element.name] = []
        }
      })
    }
  }
  selectedFilter

  filterChange(e, f) {
    this.filter_changed_data[f.displayName] = e ? e : ""
    this.selected_dropdown_value=e;
    this.makeStatsCall(this.fromDate, this.toDate);
  }

  setSelectedDateFilter(selectedValue) {

      this.selectedDate = selectedValue;
      this.dt = null; // Clear the date picker value
      if (this.dateInput) {
        this.dateInput.nativeElement.value = null;
      }
  
      this.changeStats(selectedValue);


  }

  filtersSelected = {}
  changeStatsOnDropdown(selectedDropdownVal, changedDropdown) {
    let dropDownObj= {};
    dropDownObj[changedDropdown] = selectedDropdownVal;
    this.filtersSelected[changedDropdown] = selectedDropdownVal
    this.getCardsStatsData(this.fromDate, this.toDate, dropDownObj)
  }


  getCardsStatsData(fDate, tDate, dropDownObj?) {
    this.setDates(fDate, tDate)
    this.maskEvent.mask(this.randomId, 'Loading..');
    let obj = {
      selectedFilters: this.dropdownData,
      fromDate: fDate,
      toDate: tDate,
      week_update:this.selectedFilter,
      filters:{"Segments": this.selected_dropdown_value},
    };
    
    if(dropDownObj) {
      obj['dropdown_changed'] = dropDownObj
      obj['search_filters'] = this.authService.getSelectedGlobalFilters()
    }

  


    setTimeout(() => {
      this.dataService.getCardStatsDetails(obj).subscribe(
         resp => {
 
           this.getStatsRespReceived = true;
           this.maskEvent.unMask(this.randomId);
           this.chartData = resp.data;
           this.dropdownData = resp['dropdown_data'];
           this.filterDropdowns = resp['default_dropdown_options'];
           if (this.firstCall) {
             this.filtersSelected = {...this.filterDropdowns}
           }
           // this.otherFiters = resp['Filters'] ? resp['Filters'] :[]
           this.firstCall = false;
           if (resp.data.length > 0) {
             resp.data.forEach(element => {
               element.manualrefresh = false;
             });
           }
         },
         (error) => {
           this.maskEvent.unMask(this.randomId);
         });
    }, 100);
  }

  getDropdown() {
    let keys = Object.keys(this.filterDropdowns);
    if (keys.length > this.maxFilters) {
      this.showMoreFilters = true;
      let arr = []
      for (let i = 0; i < this.maxFilters; i++) {
        arr.push(keys[i]);
      }
      return arr;
    }
    else {
      this.showMoreFilters = false;
      return keys;
    }
  }

  getExtraDropdowns() {
    let keys = Object.keys(this.filterDropdowns);
    let arr = []
    for (let i = this.maxFilters; i < keys.length; i++) {
      arr.push(keys[i]);
    }
    return arr;
  }

  refreshStats() {
    this.getStatsRespReceived = false;
    const from = new Date();
    const to = new Date();
    switch (this.selectedDate) {
      case 'Today':
        this.scale = 'today';
        this.selectedFilter='Today'
        this.authService.setSelectedStatFilters( this.selectedFilter)
        this.setDates(from, to);
        this.makeStatsCall(from, to);
        break;
      case 'Past Week':
        this.scale = 'week';
        from.setDate(from.getDate() - 7);
        this.setDates(from, to);
        this.selectedFilter='Week'
        this.authService.setSelectedStatFilters( this.selectedFilter)
        this.makeStatsCall(from, to);
        break;
      case 'Past 30 Days':
        this.scale = 'month';
        from.setDate(from.getDate() - 30);
        this.setDates(from, to);
        this.selectedFilter='month'
        this.authService.setSelectedStatFilters( this.selectedFilter)
        this.makeStatsCall(from, to);
        break;
      case 'All Time':
        this.scale = 'week';
        this.makeStatsCall('', '',);
        break;
      case 'Any Time':
        this.scale = 'week';
        this.makeStatsCall('', '',);
        break;
      default:
        break;
    }
  }

  isEmpty(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }

  changeStats(value) {
    const from = new Date();
    const to = new Date();
    switch (value) {
      case 'Today':
        this.setDates(from, to);
        this.selectedFilter='Today'
        this.authService.setSelectedStatFilters( this.selectedFilter)
        this.makeStatsCall(from, to);
        break;
      case 'Past Week':
        from.setDate(from.getDate() - 6);
        this.setDates(from, to);
        this.selectedFilter='Past Week'
        this.authService.setSelectedStatFilters( this.selectedFilter)
        this.makeStatsCall(from, to);
        break;
      case 'Past 30 Days':
        from.setDate(from.getDate() - 30);
        this.setDates(from, to);
        this.selectedFilter='Past 30 Days'
        this.authService.setSelectedStatFilters( this.selectedFilter)
        this.makeStatsCall(from, to);
        break;
      case 'All Time':
        this.makeStatsCall(this.anyTimeFromDate, this.anyTimeToDate);
        break;
      default:
        break;
    }
  }

  makeStatsCall(from, to) {
    if (from && to) {
      this.getCardsStatsData(
          this.datepipe.transform(from, 'yyyy-MM-dd'),
          this.datepipe.transform(to, 'yyyy-MM-dd'));
    } else {
      this.getCardsStatsData('', '');
    }
  }

  setDates(from, to) {
    const fdate = from ? new Date(from) : new Date();
    const tdate = to ? new Date(to) : new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December'
    ];
    // yyyy - MM - dd
    this.fromDate = this.generateDateFormat(fdate);
    this.toDate = this.generateDateFormat(tdate);

    this.fromDate_text = fdate.getDate() + ' ' + monthNames[fdate.getMonth()];
    this.toDate_text = tdate.getDate() + ' ' + monthNames[tdate.getMonth()];
  }
  generateDateFormat(dt) {
    let date_ = new Date(dt);
    let month = date_.getMonth() + 1;
    let month_with_zero = month > 9 ? month : '0' + month

    let date__ = date_.getDate();
    let date_with_zero = date__ > 9 ? date__ : '0' + date__

    return date_.getFullYear() + '-' + month_with_zero + '-' + date_with_zero
  }

  showDateFields() {
    return this.selectedDate !== 'All Time' && this.selectedDate !== 'Any Time';
  }

  anyTimeDateChanged(val: any) {
    this.selectedDate = 'Any Time';
  this.anyTimeFromDate = val.begin;
  this.anyTimeToDate = val.end;
  this.makeStatsCall(val.begin, val.end);
  }


  getInput(data, id?: any, side?: any) {
    data.fromDate = this.fromDate;
    data.toDate = this.toDate;
    data.filterDropdowns = this.filtersSelected;
    data.filters = this.filter_changed_data
    const elem: HTMLElement = document.getElementById(id);
    if (elem) {
      data.chartHeight = elem.offsetHeight;
      data.chartWidth = elem.offsetWidth - 15;
    }
    if(side) {
      data.flipSide = side;
    }
    return data;
  }

  getWidth(data) {
    return data.X ? 100 / data.X : 100;  // return as percentange
  }

  getHeight(data) {
    return (data.Y && data.Y <= 4) ? data.Y * 150 : 150 * 4;  // Return as pixel
  }

  allowRefresh(cardDetails) {
    let allow = true;
    if (cardDetails.refresh.toLowerCase() === 'none') {
      allow = false;
    }
    return allow;
  }

  manualRefresh(cardDetails, idx, clickedElement: HTMLElement) {

      // Add a class to trigger CSS rotation
  this.renderer.addClass(clickedElement, 'rotate');

  // After 2 seconds, remove the class to stop the rotation
  setTimeout(() => {
    this.renderer.removeClass(clickedElement, 'rotate');
  }, 2000);

    const chartDataItem = this.chartData[idx];
    chartDataItem.manualrefresh = true;
    setTimeout(() => {
      chartDataItem.manualrefresh = false;
    }, 1000);
  }

  onAddClick() {}

  getBgImage() {
    const randomGradients =
        ['gradient1', 'gradient2', 'gradient3', 'gradient4'];
    return randomGradients[Math.floor(Math.random() * randomGradients.length)];
  }

  ngOnDestroy() {
    this.killTrigger.next();
  }

  getTitle(vals) {
    // return vals.join(', ')
    return ""
  }

  showMoreFilter() {
    this.showMoreFiltersView = !this.showMoreFiltersView
  }

  allSelected=false;

  toggleAllSelection(dropdown, e) {
    if (e.checked) {
      this.filtersSelected[dropdown] = [...this.dropdownData[dropdown]]
    }
    else {
      this.filtersSelected[dropdown] = []
    }
  }

  getChecked(dropdown) {
    if (this.dropdownData[dropdown].length == this.filtersSelected[dropdown].length) {
      return true
    }
    return false
  }
}
