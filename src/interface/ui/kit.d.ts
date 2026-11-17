export type IconName = 'back' | 'close' | 'play' | 'learn' | 'you' | 'check' | 'next' | 'more' | 'undo' | 'down';
export function icon(name: IconName): SVGSVGElement;
export function button(label: string, options?: { kind?: string; icon?: IconName; iconOnly?: boolean; onPress?: () => void; disabledReason?: string }): HTMLButtonElement;
export function asCloseX(node: HTMLButtonElement, label: string): HTMLButtonElement;
export function closeX(label: string, onPress?: () => void): HTMLButtonElement;
export function setButtonState(button: HTMLButtonElement, state: { label?: string; reason?: string; busy?: boolean }): void;
export function choiceGroup(label: string, choices: { value: string; label: string; description?: string }[], value: string, style?: 'segments' | 'cards'): HTMLElement;
export function switchRow(label: string, description: string, checked: boolean): HTMLButtonElement;
export function turnSteps(initial?: string[]): { element: HTMLElement; update(steps: string[], sent?: boolean): void };
export function liveRegion(): { element: HTMLElement; announce(text: string): void; clear(): void };
export function confirmDialog(options: { title: string; consequence: string; action: string; cancel?: string; fallback: HTMLElement; onConfirm(): void }): { element: HTMLDialogElement; open(source: HTMLElement): void };
export function targetChoice(square: string, onChoose: (action: string) => void): HTMLElement;
export function errorState(data: { title: string; text: string; action: string; onAction: () => void }): HTMLElement;

export function navigation(current: 'Play' | 'Learn' | 'Guide' | 'You', onNavigate: (name: string) => void, options?: { guide?: boolean }): HTMLElement;
export function screenHeader(title: string, onBack: () => void): HTMLElement;
