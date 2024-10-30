import { Component, ViewChild, Input, ComponentFactoryResolver, Type } from '@angular/core';
import { DynamicComponentDirective } from '../dynamic-component-directive/dynamic-component.directive';
import { DynamicComponentsInterfaceComponent } from '../dynamic-components';
import { GenerateQueueListComponent } from '../generate-queue-list/generate-queue-list.component';
import { NoComponentFoundComponent } from '../no-component-found/no-component-found.component';
import { GenerateImagePdfExcelComponent } from '../generate-image-pdf-excel/generate-image-pdf-excel.component';
import { GenerateButtonsComponent } from '../generate-buttons/generate-buttons.component';
import { DynamicBlankFieldComponent } from '../generate-fields/dynamic-blank-field/dynamic-blank-field.component';
import { DynamicBlocksFieldComponent } from '../generate-fields/dynamic-blocks-field/dynamic-blocks-field.component';
import { DynamicCheckboxFieldComponent } from '../generate-fields/dynamic-checkbox-field/dynamic-checkbox-field.component';
import { DynamicDateFieldComponent } from '../generate-fields/dynamic-date-field/dynamic-date-field.component';
import { DynamicDropdownFieldComponent } from '../generate-fields/dynamic-dropdown-field/dynamic-dropdown-field.component';
import { DynamicNumberFieldComponent } from '../generate-fields/dynamic-number-field/dynamic-number-field.component';
import { DynamicPasswordFieldComponent } from '../generate-fields/dynamic-password-field/dynamic-password-field.component';
import { DynamicSearchDropdownFieldComponent } from '../generate-fields/dynamic-search-dropdown-field/dynamic-search-dropdown-field.component';
import { DynamicTextAreaFieldComponent } from '../generate-fields/dynamic-text-area-field/dynamic-text-area-field.component';
import { DynamicTextFieldComponent } from '../generate-fields/dynamic-text-field/dynamic-text-field.component';
import { DynamicFormService } from 'src/app/core/services/dynamicForm/dynamic-form.service';
import { DynamicUploadFileComponent } from '../generate-fields/dynamic-upload-file/dynamic-upload-file.component';
import { DynamicCustomTableComponent } from '../generate-fields/dynamic-custom-table/dynamic-custom-table.component';
import { GenerateEmailComponent } from '../generate-email/generate-email.component';
import { GenerateTemplateTrainingComponent } from '../generate-template-training/generate-template-training.component';
import { MonitorTableComponent } from 'src/app/statistics/monitor-table/monitor-table.component';
import { ClickableCardsComponent } from 'src/app/statistics/clickable-cards/clickable-cards.component';
import { MonitorChartsComponent } from 'src/app/statistics/monitor-charts/monitor-charts.component';
import { MonitorTextComponent } from 'src/app/statistics/monitor-text/monitor-text.component';
import { MonitorCardsComponent } from 'src/app/statistics/monitor-cards/monitor-cards.component';
import { SimpleTextComponent } from '../generate-fields/simple-text/simple-text.component';
import { GroupTableComp1Component } from '../customComponents/drlComps/group-table-comp1/group-table-comp1.component';
import { GroupCardsComponent } from '../customComponents/group-cards/group-cards.component';
import { FilesUploadComponent } from 'src/app/punchcard/files-upload/files-upload.component';
import { FieldPlaceholderComponent } from '../generate-fields/field-placeholder/field-placeholder.component';
import { DynamicDaterangeComponent } from '../generate-fields/dynamic-daterange/dynamic-daterange.component';
import { DynamicCommentsHistoryComponent } from '../generate-fields/dynamic-comments-history/dynamic-comments-history.component';
import { ValuesAndDependencyStoreService } from 'src/app/field-exception/service/values-dependencies-store.service';
import { DynamicSwimLaneComponent } from '../dynamic-swim-lane/dynamic-swim-lane.component';
import { GenerateSummaryTableComponent } from '../generate-summary-table/generate-summary-table.component';
import { GenerateMultiTableComponent } from '../generate-multi-table/generate-multi-table.component';
import { GenerateSpreadsheetComponent } from '../generate-spreadsheet/generate-spreadsheet.component';
import { GenerateJsonInputFieldsComponent } from '../generate-json-input-fields/generate-json-input-fields.component';
import { DynamicTimeComponent } from '../generate-fields/dynamic-time/dynamic-time.component';
import { GenerateMultiComponentTabComponent } from '../generate-multi-component-tab/generate-multi-component-tab.component';
import { ManualReconComponent } from '../manual-recon/manual-recon.component';
import { TabularReportComponent } from '../tabular-report/tabular-report.component';
import { FormulaTableComponent } from '../formula-table/formula-table.component';
import{MultiCheckboxListComponent} from '../multi-checkbox-list/multi-checkbox-list.component';
@Component({
  selector: 'app-generate-no-child-comp-group',
  template: '<div appDynamicComponent></div>',
  styleUrls: ['./generate-no-child-comp-group.component.scss']
})
export class GenerateNoChildCompGroupComponent  {

  @ViewChild(DynamicComponentDirective)
  componentContent: DynamicComponentDirective;
  componentUniqueProperties: any;
  component: DynamicComponentsInterfaceComponent;

  @Input()
  set componentProperties(data: any) {
    if(data) {
      this.componentUniqueProperties = data;
      setTimeout(() => {
        this.renderComponent();
      }, 500);
    }
  }

  get dynamicComponent() {
    return this.componentUniqueProperties;
  }

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private valueStore: ValuesAndDependencyStoreService,
              private dynamicComponentService: DynamicFormService) { }

  renderComponent() {
    const viewContainerRef = this.componentContent.viewContainer;
    viewContainerRef.clear();
    const componentFactory =
        this.componentFactoryResolver.resolveComponentFactory(
            this.resolveViewComponent() as Type<any>);
    this.component =
        viewContainerRef.createComponent(componentFactory).instance as
        DynamicComponentsInterfaceComponent;

    this.component.componentProperties = this.componentUniqueProperties;

    if (this.componentUniqueProperties && Object.keys(this.componentUniqueProperties).length > 0) {
      this.component.formField = this.dynamicComponentService.buildField(this.componentUniqueProperties, this.valueStore.getComponents())
    }
  }


  resolveViewComponent() {
    if (this.componentUniqueProperties.item_type) {
      switch (this.componentUniqueProperties.item_type) {
        case 'manual_recon':
          return ManualReconComponent
        case 'queue_list':
          return GenerateQueueListComponent;
        case 'file_tab':
          return GenerateImagePdfExcelComponent;
        case 'button_type_component':
          return GenerateButtonsComponent;
        case 'blank_field_component':
          return DynamicBlankFieldComponent;
        case 'blocks_field_component':
          return DynamicBlocksFieldComponent;
        case 'checkbox_field_component':
          return DynamicCheckboxFieldComponent;
        case 'date_field_component':
        case 'datetime_field_component':
          return DynamicDateFieldComponent;
        case 'time_field_component':
            return DynamicTimeComponent;
        case 'dropdown_field_component':
          return DynamicDropdownFieldComponent;
        case 'multi_checkbox_list':
          return MultiCheckboxListComponent;
        case 'number_field_component':
          return DynamicNumberFieldComponent;
        case 'password_field_component':
          return DynamicPasswordFieldComponent;
        case 'search_dropdown_field_component':
          return DynamicSearchDropdownFieldComponent;
        case 'textarea_field_component':
          return DynamicTextAreaFieldComponent;
        case 'text_field_component':
          return DynamicTextFieldComponent;
        case 'upload_field_component':
          return DynamicUploadFileComponent;
        case 'custom_table_field_component':
          return DynamicCustomTableComponent;
        case 'json_based_fields':
          return GenerateJsonInputFieldsComponent;
        case 'spreadsheet_field_component':
          return  GenerateSpreadsheetComponent;
        case 'summary_table':
          return GenerateSummaryTableComponent;
          case 'multi_table':
          return GenerateMultiTableComponent
        case 'training_mf_component':
          return GenerateTemplateTrainingComponent;
        case 'email_mf_component':
          return GenerateEmailComponent;
        case 'string_type_cards_component':
          return MonitorCardsComponent;
        case 'text_type_cards_component':
          return MonitorTextComponent;
        case 'chart_type_cards_component':
          return MonitorChartsComponent;
        case 'click_type_cards_component':
          return ClickableCardsComponent;
        case 'table_type_cards_component':
          return MonitorTableComponent;
        case 'simple_text':
          return SimpleTextComponent;
          case 'swim_lane':
            return DynamicSwimLaneComponent;
        case 'group_component':
          return GroupTableComp1Component;
        case 'cards_list_component':
          return GroupCardsComponent;
        case 'tabular_report_component':
          return TabularReportComponent;
        case 'formula_table_component':
          return FormulaTableComponent;
        case 'punch_card_upload_component':
          return FilesUploadComponent;
        case 'field_placeholder':
          return FieldPlaceholderComponent
        case 'date_range_field_component':
          return DynamicDaterangeComponent
        case 'comment_history_component':
          return DynamicCommentsHistoryComponent
          case 'multi_component_tab':
            return GenerateMultiComponentTabComponent
        default:
          return NoComponentFoundComponent;
      }
    } else {
      return NoComponentFoundComponent;
    }
  }
}
