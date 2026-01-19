export interface TypedMouseEvent<T extends HTMLElement> extends MouseEvent {
	currentTarget: EventTarget & T;
}
