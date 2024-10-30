import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { DataService } from 'src/app/core/services/serviceBridge/data.service';
import { MaskEventService } from 'src/app/core/services/mask-event.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/global/authentication.service';
import { StatusService } from 'src/app/core/services/statusmessage/status.service';
import { takeUntil } from 'rxjs/operators';
import { ExceptionTableModel } from 'src/app/core/model/exceptions/exception-table-model';
import { ReportRangePopupComponent } from '../report-range-popup/report-range-popup.component';
// import { downloadableFile } from '../download';
import { DomSanitizer } from '@angular/platform-browser';

import * as fileSaver from 'file-saver';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';


@Component({
  selector: 'app-generate-reports',
  templateUrl: './generate-reports.component.html',
  styleUrls: ['./generate-reports.component.scss']
})
export class GenerateReportsComponent implements OnInit, OnDestroy {
  displayedColumns = [];
  dataSource = new MatTableDataSource();
  pathId = '';
  @ViewChild(MatSort) sort: MatSort;
  private killTrigger: Subject<void> = new Subject();
  getExceptionRespReceived = false;
  firstCall = true;
  paginatorData = {};
  currentPageNumber = 1;
  numberofRecordsPerPage = 20;
  pageHeading = '';
  report_types = [];
  column_mapping:any = {};
  currentClass:any;

  constructor(private dataService: DataService, private maskEvent: MaskEventService,
    private router: Router, private route: ActivatedRoute, private snackBar: MatSnackBar,
    private authService: AuthService, private dialog: MatDialog,
    private statusService: StatusService, private sanitizer: DomSanitizer) { 
      this.authService.classtoAddSubject.subscribe((value) =>
   this.currentClass = value
   )
    }

  randomId = ""
  showSection = false;
  userTimeZone: string;
  ngOnInit() {
    this.getUserTimeZone();
    setTimeout(() => {
      this.showSection = true;
    }, 1000);
    this.authService.classtoAddSubject.next(this.authService.getCurrentTheme())
    this.randomId = this.authService.randomID(6);
    this.maskEvent.mask(this.randomId, 'Loading ..');
    this.pathId = this.route.snapshot.queryParams['pathId'];
    timer(0, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTrigger),
      )
      .subscribe(t => {
        if ((this.getExceptionRespReceived || this.firstCall) && this.currentPageNumber === 1 && !this.filterApplied) {
          this.getFiles(1, this.numberofRecordsPerPage);
        }
    });
    this.getFiles(1, this.numberofRecordsPerPage);
  }

  filterText: string = "";
  filterApplied = false;

  applyFilter(filterValue: string) {
    if(filterValue == ""){
      this.filterText = filterValue.trim().toLowerCase()
      this.dataSource.filter = this.filterText;
      this.ClearSearchFilter()
      return;
    }
    this.filterText = filterValue.trim().toLowerCase()
    this.dataSource.filter = this.filterText;
  }

  applySearchFilter() {
    if (this.filterText) {
      this.filterApplied = true;
      this.maskEvent.mask(this.randomId, 'Loading...')
      this.getFiles(1, this.numberofRecordsPerPage)
    }
  }

  ClearSearchFilter() {
    this.dataSource.filter = '';
    // this.showClear = false;
    this.maskEvent.mask(this.randomId, 'Loading...')
    this.getFiles(1, this.numberofRecordsPerPage);
  }

  getNextOrPreviousRecords(event) {
    this.currentPageNumber = event.pageNumber;
    this.maskEvent.mask(this.randomId, 'Loading ..');
    this.getFiles(event.start, event.end);
  }

  checkView = true

  getFiles(start, end) {
    this.firstCall = false;
    this.getExceptionRespReceived = false;
    const params = { queue_id: this.pathId, start: start, end: end, filter_text: this.filterText };
    this.dataService.getReports(params).subscribe(
      (response) => {
        this.getExceptionRespReceived = true;
        this.maskEvent.unMask(this.randomId);
        if (response.data && response.data.column_order &&
          response.data.column_order.length > 0) {
          this.displayedColumns = response.data.column_order;
         // Define the desired order of properties

         if (this.tenant_id === 'kmb'){
            const desiredOrder = ['start_date', 'end_date', 'segment','zone'];
            let files=[];
            
            for (let i=0;i<response.data.files.length;i++){
              let tags=Object.fromEntries(
                Object.entries(response.data.files[i].tags)
                  .filter(([key]) => desiredOrder.includes(key))
                  .sort(([a], [b]) => desiredOrder.indexOf(a) - desiredOrder.indexOf(b))
              );

              files.push({...response.data.files[i],tags})
              
            }

            response.data.files=files;

        }


        
          this.dataSource = new MatTableDataSource<ExceptionTableModel>(
            response.data.files.map(file => ({
              ...file,
              requested_datetime: this.convertToMYT(file.requested_datetime),
              generated_datetime: this.convertToMYT(file.generated_datetime)
            }))
          );
          this.column_mapping = response.data.column_mapping;
          this.report_types = response.data.reports;
          this.paginatorData = response.data.pagination;
          this.dataSource.sort = this.sort;
          if (response.data.hasOwnProperty("get_report_view")){
          if (!response.data.get_report_view){
          this.checkView = response.data.get_report_view
          }
        }
          setTimeout(() => {
            this.dataSource.sort = this.sort;
          }, (1000));
        }
      },
      (error) => {
        this.maskEvent.unMask(this.randomId);
      });
  }
  tenant_id = this.authService.getTenantId();
  convertToMYT(istDateTime) {
    if(this.tenant_id === 'ambankdisbursement' || this.tenant_id === 'ambanketrade'){
      if(this.userTimeZone === "Asia/Singapore" || this.userTimeZone === "Asia/Kuala_Lumpur"){
        const istDate = new Date(istDateTime);  
        istDate.setHours(istDate.getHours() + 2);  
        istDate.setMinutes(istDate.getMinutes() + 30); 
        const month = (istDate.getMonth() + 1).toString().padStart(2, '0'); 
        const day = istDate.getDate().toString().padStart(2, '0');
        const year = istDate.getFullYear();
        const hours = istDate.getHours().toString().padStart(2, '0');
        const minutes = istDate.getMinutes().toString().padStart(2, '0');
        const seconds = istDate.getSeconds().toString().padStart(2, '0');

        return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
     }
     else{
      return istDateTime
     }
    } 
    else{
      return istDateTime
   }
}
getUserTimeZone() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  this.userTimeZone = timeZone;
}

  

  showPopup() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '50%';
    dialogConfig.panelClass = 'reportPanel'
    dialogConfig.backdropClass = 'reportBackDrop'
    dialogConfig.data = {
      report_types: this.report_types
    };

    const dialogRef = this.dialog.open(ReportRangePopupComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result.service) {
        this.serviceCall(result.reportparams);
      }
    });
  }

  serviceCall(params) {
    this.maskEvent.mask(this.randomId, 'Generating Report...')
    this.dataService.generateReport(params).subscribe(
      (response) => {
        this.maskEvent.unMask(this.randomId)
        if (response.flag) {
          // this.statusService.post('success', response.message);
          this.snackBar.open(response.message, 'close', {
            duration: 5000,
          });
          this.getFiles(1, this.numberofRecordsPerPage);
        }
      },
      (error) => {
        this.maskEvent.unMask(this.randomId)
      });
  }

  getColor(text) {
    if (text.toLowerCase() === "processing") {
      return '#FCF0E8';
    } else if (text.toLowerCase() === "download") {
      return '#E9EFF8'
    } else {
      return '#E54949'
    }
  }

  ngOnDestroy() {
    this.killTrigger.next();
  }

  isDownloadable(row) {
    return row.status.toLowerCase() === "download"
  }

  navigateToView(row) {
    this.router.navigate(['reportview'], {
      queryParams: { pathId: this.pathId, ref_id: row.reference_id, status: row.status, rep_name:row.report_name},
      relativeTo: this.route
    });
  }

  downloadFile(row) {
    if (this.isDownloadable(row)) {

      this.maskEvent.mask(this.randomId, 'Downloading Report...')

      this.dataService.downloadReport(row).subscribe(
        (response) => {
          this.maskEvent.unMask(this.randomId)
          if (response.flag) {
            const url = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + response['blob'];
            const fileName = response['filename'];

            this.downloadFileMain(url, fileName);
          }
        },
        (error) => {
          this.maskEvent.unMask(this.randomId)
        });
    }
  }


  downloadFileMain(url, file_name) {
    fileSaver.saveAs(url, file_name);
  }

  getTags(e) {
    // return e ? Object.keys(e.toLowerCase()) : [];
    return e ? Object.keys(e).map(key => key.toLowerCase()) : [];
  }

  getTagValue(e) {
    try {
      return JSON.stringify(e)
    } catch (error) {
      return e
    }
  }

}
