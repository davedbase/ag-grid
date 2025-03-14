import { AgPickerField, IPickerFieldParams } from "./agPickerField";
import { ListOption, AgList } from "./agList";
import { Events } from "../eventKeys";
import { KeyCode } from "../constants/keyCode";

export class AgSelect extends AgPickerField<string | null, IPickerFieldParams, AgList> {
    public static EVENT_ITEM_SELECTED = 'selectedItem';
    protected listComponent: AgList | undefined;
    private pickerFocusOutListener: (() => null) | undefined;

    constructor(config?: IPickerFieldParams) {
        super({
            pickerAriaLabelKey: 'ariaLabelSelectField',
            pickerAriaLabelValue: 'Select Field',
            pickerType: 'ag-list',
            className: 'ag-select',
            pickerIcon: 'smallDown',
            ariaRole: 'listbox',
            ...config
        });
    }

    protected postConstruct(): void {
        super.postConstruct();
        this.createListComponent();
        this.eWrapper.tabIndex = this.gridOptionsService.getNum('tabIndex') ?? 0;
    }

    private createListComponent(): void {
        this.listComponent = this.createBean(new AgList('select'));
        this.listComponent.setParentComponent(this);

        this.listComponent.addGuiEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === KeyCode.TAB) {
                e.preventDefault();
                e.stopImmediatePropagation();

                this.getGui().dispatchEvent(new KeyboardEvent('keydown', {
                    key: e.key,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    bubbles: true
                }));
            };
        })

        this.listComponent.addManagedListener(
            this.listComponent,
            AgList.EVENT_ITEM_SELECTED,
            () => {
                this.hidePicker();
                this.dispatchEvent({ type: AgSelect.EVENT_ITEM_SELECTED });
            }
        );

        this.listComponent.addManagedListener(
            this.listComponent,
            Events.EVENT_FIELD_VALUE_CHANGED,
            () => {
                if (!this.listComponent) { return; }
                this.setValue(this.listComponent.getValue()!, false, true);
                this.hidePicker();
            }
        );
    }

    protected createPickerComponent() {
        // do not create the picker every time to save state
        return this.listComponent!;
    }

    public showPicker() {
        if (!this.listComponent) { return; }

        super.showPicker();

        const ePicker = this.listComponent.getGui();
        this.pickerFocusOutListener = this.addManagedListener(ePicker, 'focusout', (e: FocusEvent) => {
            if (!ePicker.contains(e.relatedTarget as HTMLElement)) {
                this.hidePicker();
            }
        });

        this.listComponent.refreshHighlighted();
    }

    protected beforeHidePicker(): void {
        if (this.pickerFocusOutListener) {
            this.pickerFocusOutListener();
            this.pickerFocusOutListener = undefined;
        }

        super.beforeHidePicker();
    }

    public addOptions(options: ListOption[]): this {
        options.forEach(option => this.addOption(option));

        return this;
    }

    public addOption(option: ListOption): this {
        this.listComponent!.addOption(option);

        return this;
    }

    public setValue(value?: string | null , silent?: boolean, fromPicker?: boolean): this {
        if (this.value === value || !this.listComponent) { return this; }

        if (!fromPicker) {
            this.listComponent.setValue(value, true);
        }

        const newValue = this.listComponent.getValue();

        if (newValue === this.getValue()) { return this; }

        this.eDisplayField.innerHTML = this.listComponent.getDisplayValue()!;

        return super.setValue(value, silent);
    }

    protected destroy(): void {
        if (this.listComponent) {
            this.destroyBean(this.listComponent);
            this.listComponent = undefined;
        }

        super.destroy();
    }
}
