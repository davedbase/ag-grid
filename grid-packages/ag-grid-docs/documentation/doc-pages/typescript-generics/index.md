---
title: "Typescript Generics"
---

AG Grid supports Typescript [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) for row data and cell values. This leads to greatly improved developer experience via code completion and compile time validation of row data and cell value properties.

## Row Data: \<TData\>

Provide a Typescript interface for row data to the grid to enable auto-completion and type-checking whenever properties are accessed from a row `data` variable. There are multiple ways to configure the generic interface: via the `GridOptions<TData>` interface, via other individual interfaces and finally via framework components.

In the examples below we will use the `ICar` interface to represent row data.

<snippet transform={false} langauge="ts"> 
|// Row Data interface
|interface ICar {
|    make: string;
|    model: string;
|    price: number;
|}
</snippet>

### Configure via GridOptions

Set the row data type on the grid options interface via `GridOptions<ICar>`. The `ICar` interface will then be used throughout the grid options whenever row data is present. This is true for: properties, callbacks, events and the gridApi.

<snippet transform={false} langauge="ts"> 
|// Pass ICar to GridOptions as a generic
|const gridOptions: GridOptions&lt;ICar> = {
|    // rowData is typed as ICar[]
|    rowData: [ { make: 'Ford', model: 'Galaxy', price: 20000 } ],
|
|    // Callback with params type: GetRowIdParams&lt;ICar>
|    getRowId: (params) => {
|        // params.data : ICar
|        return params.data.make + params.data.model;
|    },
|
|    // Event with type: RowSelectedEvent&lt;ICar>
|    onRowSelected: (event) => {
|        // event.data: ICar | undefined
|        if (event.data) {
|            const price = event.data.price;
|        }
|    }
|}
|
|// Grid Api methods use ICar interface
|function onSelection() {
|  // api.getSelectedRows() : ICar[]
|  const cars: ICar[] = gridOptions.api!.getSelectedRows();  
|}
</snippet>

<note>
You do not need to explicitly type callbacks and events that are defined as part of `GridOptions`. Typescript will correctly pass the generic type down the interface hierarchy.
</note>

### Configure via Interfaces

Each interface that accepts a generic type of `TData` can also be configured individually. For example, an event handler function can accept the generic parameter on the event `RowSelectedEvent`.

<snippet transform={false} language="ts">
function onRowSelected(event: RowSelectedEvent&lt;ICar>) {
    if (event.data) {
        // event.data: ICar | undefined
        const price = event.data.price;
    }
}
</snippet>

<framework-specific-section frameworks="angular">
|### Configure via Component
|
|The `&lt;ag-grid-angular>` component is generic with respect to `TData`. As there is no way to explicitly set generic parameters on Angular components, Angular infers the `TData` generic type from Inputs / Outputs. However, it will not always be successful, leaving `TData` inferred as `any`. 
|
|We recommend providing the generic `TData` type to  your `columnDefs` property as in practice we see this leading to the most accurate inference.
|
|To provide the generic type of `ICar` to the `columnDefs` property you use the type `ColDef&lt;ICar>` as follows:
</framework-specific-section>

<framework-specific-section frameworks="angular">
<snippet transform={false} language="ts">
|const columnDefs: ColDef&lt;ICar>[] = [...];
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="angular">
|Then set this on your component template as `[columnDefs]="columnDefs"`. This provides Angular with the information it needs to assigns `ICar` to `TData` for the component.
</framework-specific-section>

<framework-specific-section frameworks="angular">
<snippet transform={false} language="html">
|&lt;ag-grid-angular 
|    [columnDefs]="columnDefs"    
|    (rowSelected)="onRowSelected($event)"
|>&lt;/ag-grid-angular>
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="angular">
|This generic parameter is used for all other Inputs and Outputs ensuring consistency across the component. If `(rowSelected)` is defined with a different interface the application code will fail to compile.
</framework-specific-section>

<framework-specific-section frameworks="angular">
<snippet transform={false} language="ts">
|// ERROR: INotACar is not assignable to ICar
|onRowSelected(event: RowSelectedEvent&lt;INotACar>) {}
|
|// SUCCESS: ICar is correct interface
|onRowSelected(event: RowSelectedEvent&lt;ICar>) {}
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="react">
<snippet transform={false} language="ts">
|### Configure via Component
|
|The `&lt;AgGridReact>` component accepts a generic parameter as `&lt;AgGridReact&lt;ICar>>`.
|
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="react">
<snippet transform={false} language="jsx">
|&lt;AgGridReact&lt;ICar>
|    ref={gridRef}
|    rowData={rowData}
|    onRowSelected={onRowSelected}
|>
|&lt;/AgGridReact>
</snippet>
</framework-specific-section>

<framework-specific-section frameworks="react">
|This ensures all the props defined on `&lt;AgGridReact>` conform to the `ICar` interface. These props can be defined with types like this.
</framework-specific-section>

<framework-specific-section frameworks="react">
<snippet transform={false} language="ts">
|const gridRef = useRef&lt;AgGridReact&lt;ICar>>(null);
|
|const [rowData, setRowData] = useState&lt;ICar[]>([ ... ]);
|
|const onRowSelected = useCallback((event: RowSelectedEvent&lt;ICar>) => { ... }, [])
</snippet>
</framework-specific-section>

### Type: TData | undefined

For a number of events and callbacks, when a generic interface is provided, the `data` property is typed as `TData | undefined` instead of `any`. The undefined is required because it is possible for the `data` property to be undefined under certain grid configurations. 

A good example of this is [Row Grouping](/grouping). The `onRowSelected` event is fired for both leaf and group rows. Data is only present on leaf nodes and so the event should be written to handle cases when `data` is undefined for groups.

<snippet transform={false} langauge="ts">
|function onRowSelected(event: RowSelectedEvent&lt;ICar>) {
|    // event.data is typed as ICar | undefined
|    if (event.data) {
|        // Leaf row with data
|        const price = event.data.price;
|    } else {
|        // This is a group row
|    }
|}
</snippet>

## Cell Value: \<TValue\>

When working with cell values it is possible to provide a generic interface for the `value` property. While this will often be a primitive type, such as `string` or `number`, it can also be a complex type. Using a generic for the cell value will enable auto-completion and type-checking.

### Configure via ColDef

Set the cell value type directly on the column definition interface via `ColDef<TData, TValue>` (e.g. `ColDef<ICar, number>`). This will be passed through to all properties in the column definition that use the cell value type.

### Configure via Interfaces

Each interface that accepts a generic type of `TValue` can also be configured individually. Here is an example of a `valueFormatter` for the price column. The `params.value` property is correctly typed as a `number` due to typing the params argument as `ValueFormatterParams<ICar, number>`.

<snippet transform={false} langauge="ts">
|const colDefs: ColDef&lt;ICar>[] = [
|     {
|        field: 'price',
|        valueFormatter: (params: ValueFormatterParams&lt;ICar, number>) => {
|            // params.value : number
|            return "£" + params.value;
|        }
|    }
|];
</snippet>

The `TValue` generic type is also supported for cell renderers / editors by `ICellRendererParams<TData, TValue>` and `ICellEditorParams<TData, TValue>` respectively.

### Typed: TValue | null | undefined

For a number of events and callbacks when a generic interface is provided, the `value` property is typed as `TValue | null | undefined` instead of `any`. This is because it is possible for the `value` property to be `undefined` under certain grid configurations, and it can be `null` when cell editing is enabled and the value has been deleted.

## Context: \<TContext\>

The grid options property `context` can be used to provided additional information to grid callbacks and event handlers implemented by your application. See [Context](/context) for more details. The `params.context` property can be typed via the `TContext` generic parameter.

### Configure via Interfaces

The generic parameter `TContext` needs to be explicitly provided to each interface where it is used.  For example, an event handler function can accept the generic parameter on the event `RowSelectedEvent<TData, TContext>`. 

<snippet transform={false} langauge="ts">
|// Define the interface for your context
|interface IDiscountRate {
|    discount: number;
|}
|
|// Set the context property on gridOptions using `as` to apply the type
|const gridOptions: GridOptions&lt;ICar> {
|    context: {
|        discount: 0.9
|    } as IDiscountRate;
|}
|
|// Provide to the interface to the TContext generic parameter to type the params.context property
|function onRowSelected(event: RowSelectedEvent&lt;ICar, IDiscountRate>) {
|    if (event.data) {
|        // event.context.discount is typed as number
|        const price = event.data.price * event.context.discount;
|    }
|}
</snippet>


## Generic Type Example

Inspect the code in the following example or open in Plunker to experiment with generic typing yourself.

- `rowData` is typed using the `ICar` interface via `TData`.
- `valueFormatter` types the `value` property as `number` via `TValue`.
- `onRowSelected` event handler uses the `IDiscountRate` interface via `TContext`.

<grid-example title='Generic Types' name='generic' type='generated' options='{ "exampleHeight": 500 }'></grid-example>

## Fallback Default

If generic interfaces are not provided then the grid will use the default type of `any`. This means that generics in AG Grid are completely optional. GridOptions is defined as `GridOptions<TData = any>`, so if a generic parameter is not provided then `any` is used in its place for row data properties. 

Likewise for cell values, if a generic parameter is not provided, `any` is used for the value property. For example, cell renderer params are defined as `ICellRendererParams<TData = any, TValue = any>`.

