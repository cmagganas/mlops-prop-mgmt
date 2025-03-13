import { InAppMessageInteractionEvent } from '../../InAppMessaging/types';
import { PushNotificationEvent } from '../../PushNotification/types';
export interface EventListener<EventHandler extends Function> {
    handleEvent: EventHandler;
    remove: () => void;
}
export declare type EventType = InAppMessageInteractionEvent | PushNotificationEvent;
