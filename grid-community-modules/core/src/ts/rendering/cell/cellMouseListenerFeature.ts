import { Column } from "../../entities/column";
import { CellClickedEvent, CellDoubleClickedEvent, CellMouseOutEvent, CellMouseOverEvent, Events } from "../../events";
import { isBrowserSafari, isIOSUserAgent } from "../../utils/browser";
import { isElementChildOfClass, isFocusableFormField } from "../../utils/dom";
import { isEventSupported, isStopPropagationForAgGrid } from "../../utils/event";
import { Beans } from "../beans";
import { CellCtrl } from "./cellCtrl";

export class CellMouseListenerFeature extends Beans {

    private readonly cellCtrl: CellCtrl;
    private readonly beans: Beans;
    private readonly column: Column;

    private lastIPadMouseClickEvent: number;

    constructor(ctrl: CellCtrl, beans: Beans, column: Column) {
        super();
        this.cellCtrl = ctrl;
        this.beans = beans;
        this.column = column;
    }

    public onMouseEvent(eventName: string, mouseEvent: MouseEvent): void {
        if (isStopPropagationForAgGrid(mouseEvent)) { return; }

        switch (eventName) {
            case 'click':
                this.onCellClicked(mouseEvent);
                break;
            case 'mousedown':
            case 'touchstart':
                this.onMouseDown(mouseEvent);
                break;
            case 'dblclick':
                this.onCellDoubleClicked(mouseEvent);
                break;
            case 'mouseout':
                this.onMouseOut(mouseEvent);
                break;
            case 'mouseover':
                this.onMouseOver(mouseEvent);
                break;
        }
    }

    private onCellClicked(mouseEvent: MouseEvent): void {
        // iPad doesn't have double click - so we need to mimic it to enable editing for iPad.
        if (this.isDoubleClickOnIPad()) {
            this.onCellDoubleClicked(mouseEvent);
            mouseEvent.preventDefault(); // if we don't do this, then iPad zooms in

            return;
        }

        const { eventService, rangeService, gridOptionsService } = this.beans;
        const isMultiKey = mouseEvent.ctrlKey || mouseEvent.metaKey;

        if (rangeService && isMultiKey) {
            // the mousedown event has created the range already, so we only intersect if there is more than one
            // range on this cell
            if (rangeService.getCellRangeCount(this.cellCtrl.getCellPosition()) > 1) {
                rangeService.intersectLastRange(true);
            }
        }

        const cellClickedEvent: CellClickedEvent = this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_CLICKED);
        eventService.dispatchEvent(cellClickedEvent);

        const colDef = this.column.getColDef();

        if (colDef.onCellClicked) {
            // to make callback async, do in a timeout
            window.setTimeout(() => colDef.onCellClicked!(cellClickedEvent), 0);
        }

        const editOnSingleClick = (gridOptionsService.is('singleClickEdit') || colDef.singleClickEdit)
            && !gridOptionsService.is('suppressClickEdit');

        if (editOnSingleClick) {
            this.cellCtrl.startRowOrCellEdit();
        }
    }

    // returns true if on iPad and this is second 'click' event in 200ms
    private isDoubleClickOnIPad(): boolean {
        if (!isIOSUserAgent() || isEventSupported('dblclick')) { return false; }

        const nowMillis = new Date().getTime();
        const res = nowMillis - this.lastIPadMouseClickEvent < 200;
        this.lastIPadMouseClickEvent = nowMillis;

        return res;
    }

    private onCellDoubleClicked(mouseEvent: MouseEvent) {
        const colDef = this.column.getColDef();
        // always dispatch event to eventService
        const cellDoubleClickedEvent: CellDoubleClickedEvent = this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_DOUBLE_CLICKED);
        this.beans.eventService.dispatchEvent(cellDoubleClickedEvent);

        // check if colDef also wants to handle event
        if (typeof colDef.onCellDoubleClicked === 'function') {
            // to make the callback async, do in a timeout
            window.setTimeout(() => (colDef.onCellDoubleClicked as any)(cellDoubleClickedEvent), 0);
        }

        const editOnDoubleClick = !this.beans.gridOptionsService.is('singleClickEdit')
            && !this.beans.gridOptionsService.is('suppressClickEdit');
        if (editOnDoubleClick) {
            this.cellCtrl.startRowOrCellEdit(null, mouseEvent);
        }
    }

    private onMouseDown(mouseEvent: MouseEvent): void {
        const { ctrlKey, metaKey, shiftKey } = mouseEvent;
        const target = mouseEvent.target as HTMLElement;
        const { eventService, rangeService } = this.beans;

        // do not change the range for right-clicks inside an existing range
        if (this.isRightClickInExistingRange(mouseEvent)) {
            return;
        }

        const ranges = rangeService && rangeService.getCellRanges().length != 0;

        if (!shiftKey || !ranges) {
            // We only need to pass true to focusCell when the browser is Safari and we are trying
            // to focus the cell itself. This should never be true if the mousedown was triggered
            // due to a click on a cell editor for example.
            const forceBrowserFocus = (isBrowserSafari()) && !this.cellCtrl.isEditing() && !isFocusableFormField(target);

            this.cellCtrl.focusCell(forceBrowserFocus);
        }

        // if shift clicking, and a range exists, we keep the focus on the cell that started the
        // range as the user then changes the range selection.
        if (shiftKey && ranges) {
            // this stops the cell from getting focused
            mouseEvent.preventDefault();
        }

        // if we are clicking on a checkbox, we need to make sure the cell wrapping that checkbox
        // is focused but we don't want to change the range selection, so return here.
        if (this.containsWidget(target)) { return; }

        if (rangeService) {
            const thisCell = this.cellCtrl.getCellPosition();

            if (shiftKey) {
                rangeService.extendLatestRangeToCell(thisCell);
            } else {
                const isMultiKey = ctrlKey || metaKey;
                rangeService.setRangeToCell(thisCell, isMultiKey);
            }
        }

        eventService.dispatchEvent(this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_MOUSE_DOWN));
    }

    private isRightClickInExistingRange(mouseEvent: MouseEvent): boolean {
        const { rangeService } = this.beans;

        if (rangeService) {
            const cellInRange = rangeService.isCellInAnyRange(this.cellCtrl.getCellPosition());
            const isRightClick = mouseEvent.button === 2 || (mouseEvent.ctrlKey && this.gridOptionsService.is('allowContextMenuWithControlKey'));

            if (cellInRange && isRightClick) {
                return true;
            }
        }

        return false;
    }

    private containsWidget(target: HTMLElement): boolean {
        return isElementChildOfClass(target, 'ag-selection-checkbox', 3);
    }

    private onMouseOut(mouseEvent: MouseEvent): void {
        if (this.mouseStayingInsideCell(mouseEvent)) { return; }
        const cellMouseOutEvent: CellMouseOutEvent = this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_MOUSE_OUT);
        this.beans.eventService.dispatchEvent(cellMouseOutEvent);
        this.beans.columnHoverService.clearMouseOver();
    }

    private onMouseOver(mouseEvent: MouseEvent): void {
        if (this.mouseStayingInsideCell(mouseEvent)) { return; }
        const cellMouseOverEvent: CellMouseOverEvent = this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_MOUSE_OVER);
        this.beans.eventService.dispatchEvent(cellMouseOverEvent);
        this.beans.columnHoverService.setMouseOver([this.column]);
    }

    private mouseStayingInsideCell(e: MouseEvent): boolean {
        if (!e.target || !e.relatedTarget) { return false; }
        const eGui = this.cellCtrl.getGui();
        const cellContainsTarget = eGui.contains(e.target as Node);
        const cellContainsRelatedTarget = eGui.contains(e.relatedTarget as Node);
        return cellContainsTarget && cellContainsRelatedTarget;
    }

    public destroy(): void {
    }
}