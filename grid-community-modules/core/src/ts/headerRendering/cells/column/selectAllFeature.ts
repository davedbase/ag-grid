import { AgCheckbox } from "../../../widgets/agCheckbox";
import { BeanStub } from "../../../context/beanStub";
import { Autowired } from "../../../context/context";
import { ColumnApi } from "../../../columns/columnApi";
import { GridApi } from "../../../gridApi";
import { Events, SelectionEventSourceType } from "../../../events";
import { IRowModel } from "../../../interfaces/iRowModel";
import { Column } from "../../../entities/column";
import { RowNode } from "../../../entities/rowNode";
import { ISelectionService } from "../../../interfaces/iSelectionService";
import { HeaderCellCtrl } from "./headerCellCtrl";
import { setAriaHidden, setAriaRole } from "../../../utils/aria";
import { HeaderCheckboxSelectionCallbackParams } from "../../../entities/colDef";

export class SelectAllFeature extends BeanStub {

    @Autowired('gridApi') private gridApi: GridApi;
    @Autowired('columnApi') private columnApi: ColumnApi;
    @Autowired('rowModel') private rowModel: IRowModel;
    @Autowired('selectionService') private selectionService: ISelectionService;

    private cbSelectAllVisible = false;
    private processingEventFromCheckbox = false;
    private column: Column;
    private headerCellCtrl: HeaderCellCtrl;

    private filteredOnly: boolean;
    private currentPageOnly: boolean;

    private cbSelectAll: AgCheckbox;

    constructor(column: Column) {
        super();
        this.column = column;

        const colDef = column.getColDef();
        this.filteredOnly = !!colDef?.headerCheckboxSelectionFilteredOnly;
        this.currentPageOnly = !!colDef?.headerCheckboxSelectionCurrentPageOnly;
    }

    public onSpaceKeyDown(e: KeyboardEvent): void {
        const checkbox = this.cbSelectAll;
        const eDocument = this.gridOptionsService.getDocument();

        if (checkbox.isDisplayed() && !checkbox.getGui().contains(eDocument.activeElement)) {
            e.preventDefault();
            checkbox.setValue(!checkbox.getValue());
        }
    }

    public getCheckboxGui(): HTMLElement {
        return this.cbSelectAll.getGui();
    }

    public setComp(ctrl: HeaderCellCtrl): void {
        this.headerCellCtrl = ctrl;
        this.cbSelectAll = this.createManagedBean(new AgCheckbox());
        this.cbSelectAll.addCssClass('ag-header-select-all');
        setAriaRole(this.cbSelectAll.getGui(), 'presentation');
        this.showOrHideSelectAll();

        this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, this.showOrHideSelectAll.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.showOrHideSelectAll.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_SELECTION_CHANGED, this.onSelectionChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_PAGINATION_CHANGED, this.onSelectionChanged.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_MODEL_UPDATED, this.onModelChanged.bind(this));
        this.addManagedListener(this.cbSelectAll, Events.EVENT_FIELD_VALUE_CHANGED, this.onCbSelectAll.bind(this));
        setAriaHidden(this.cbSelectAll.getGui(), true);
        this.cbSelectAll.getInputElement().setAttribute('tabindex', '-1');
        this.refreshSelectAllLabel();
    }

    private showOrHideSelectAll(): void {
        this.cbSelectAllVisible = this.isCheckboxSelection();
        this.cbSelectAll.setDisplayed(this.cbSelectAllVisible, { skipAriaHidden: true });

        if (this.cbSelectAllVisible) {
            // in case user is trying this feature with the wrong model type
            this.checkRightRowModelType('selectAllCheckbox');
            // in case user is trying this feature with the wrong model type
            this.checkSelectionType('selectAllCheckbox');
            // make sure checkbox is showing the right state
            this.updateStateOfCheckbox();
        }
        this.refreshSelectAllLabel();
    }

    private onModelChanged(): void {
        if (!this.cbSelectAllVisible) { return; }
        this.updateStateOfCheckbox();
    }

    private onSelectionChanged(): void {
        if (!this.cbSelectAllVisible) { return; }
        this.updateStateOfCheckbox();
    }

    private updateStateOfCheckbox(): void {
        if (this.processingEventFromCheckbox) { return; }

        this.processingEventFromCheckbox = true;

        const allSelected = this.selectionService.getSelectAllState(this.filteredOnly, this.currentPageOnly);

        this.cbSelectAll.setValue(allSelected!);
        this.refreshSelectAllLabel();

        this.processingEventFromCheckbox = false;
    }

    private refreshSelectAllLabel(): void {
        const translate = this.localeService.getLocaleTextFunc();
        const checked = this.cbSelectAll.getValue();
        const ariaStatus = checked ? translate('ariaChecked', 'checked') : translate('ariaUnchecked', 'unchecked');
        const ariaLabel = translate('ariaRowSelectAll', 'Press Space to toggle all rows selection');


        if (!this.cbSelectAllVisible) {
            this.headerCellCtrl.setAriaDescriptionProperty('selectAll', null);
        } else {
            this.headerCellCtrl.setAriaDescriptionProperty('selectAll', `${ariaLabel} (${ariaStatus})`);
        }

        this.cbSelectAll.setInputAriaLabel(`${ariaLabel} (${ariaStatus})`);
        this.headerCellCtrl.refreshAriaDescription();
    }

    private checkSelectionType(feature: string): boolean {
        const isMultiSelect = this.gridOptionsService.get('rowSelection') === 'multiple';

        if (!isMultiSelect) {
            console.warn(`AG Grid: ${feature} is only available if using 'multiple' rowSelection.`);
            return false;
        }
        return true;
    }

    private checkRightRowModelType(feature: string): boolean {
        const rowModelType = this.rowModel.getType();
        const rowModelMatches = rowModelType === 'clientSide' || rowModelType === 'serverSide';

        if (!rowModelMatches) {
            console.warn(`AG Grid: ${feature} is only available if using 'clientSide' or 'serverSide' rowModelType, you are using ${rowModelType}.`);
            return false;
        }
        return true;
    }

    private onCbSelectAll(): void {
        if (this.processingEventFromCheckbox) { return; }
        if (!this.cbSelectAllVisible) { return; }

        const value = this.cbSelectAll.getValue();

        let source: SelectionEventSourceType = 'uiSelectAll';
        if (this.currentPageOnly) source = 'uiSelectAllCurrentPage';
        else if (this.filteredOnly) source = 'uiSelectAllFiltered';

        const params = {
            source,
            justFiltered: this.filteredOnly,
            justCurrentPage: this.currentPageOnly,
        };
        if (value) {
            this.selectionService.selectAllRowNodes(params);
        } else {
            this.selectionService.deselectAllRowNodes(params);
        }
    }

    private isCheckboxSelection(): boolean {
        let result = this.column.getColDef().headerCheckboxSelection;

        if (typeof result === 'function') {
            const func = result as (params: HeaderCheckboxSelectionCallbackParams) => boolean;
            const params: HeaderCheckboxSelectionCallbackParams = {
                column: this.column,
                colDef: this.column.getColDef(),
                columnApi: this.columnApi,
                api: this.gridApi,
                context: this.gridOptionsService.context
            };
            result = func(params);
        }

        if (result) {
            return this.checkRightRowModelType('headerCheckboxSelection') && this.checkSelectionType('headerCheckboxSelection');
        }

        return false;
    }

}

interface SelectionCount {
    selected: number;
    notSelected: number;
}
