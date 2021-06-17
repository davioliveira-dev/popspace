import { Analytics } from '@analytics/Analytics';
import { EventNames, Origin } from '@analytics/constants';
import { ApiCoreClient } from '@api/ApiCoreClient';
import { RoomPositionState } from '@api/roomState/types/common';
import {
  IncomingWidgetCreatedMessage,
  IncomingWidgetDeletedMessage,
  IncomingWidgetUpdatedMessage,
} from '@api/roomState/types/socketProtocol';
import { WidgetState, WidgetStateByType, WidgetType } from '@api/roomState/types/widgets';
import { useOnboarding } from '@features/onboarding/useOnboarding';
import { ApiSubClient } from './ApiSubClient';

export class WidgetClient extends ApiSubClient {
  constructor(core: ApiCoreClient) {
    super(core);
    core.socket.on('message:widgetCreated', this.onWidgetCreated);
    core.socket.on('message:widgetUpdated', this.onWidgetUpdated);
    core.socket.on('message:widgetDeleted', this.onWidgetDeleted);
  }

  private onWidgetCreated = (message: IncomingWidgetCreatedMessage) => {
    this.core.cacheApi.addWidget(message.payload);
  };

  private onWidgetUpdated = (message: IncomingWidgetUpdatedMessage) => {
    this.core.cacheApi.updateWidget(message.payload);
  };

  private onWidgetDeleted = (message: IncomingWidgetDeletedMessage) => {
    this.core.cacheApi.deleteWidget(message.payload);
  };

  // Public API

  /**
   * Creates a widget. You can await the call to receive the
   * final widget state with ID once it has been returned
   * from the server.
   */
  addWidget = async <Type extends WidgetType>(
    payload: {
      type: Type;
      widgetState: WidgetStateByType[Type];
      transform: RoomPositionState;
    },
    origin?: Origin
  ) => {
    if (!payload.widgetState || !payload.type) {
      throw new Error(
        `Error creating widget: invalid data. Widget type: ${
          payload?.type
        } Widget state is provided: ${!!payload?.widgetState}`
      );
    }
    // we don't know the Widget ID until the server rebroadcasts
    // this event to everyone with the ID provided - so there is no
    // optimistic change, just sending the event.
    const response = await this.core.socket.sendAndWaitForResponse<IncomingWidgetCreatedMessage>({
      kind: 'createWidget',
      payload,
    });

    // track the widget creation event
    Analytics.trackEvent(EventNames.CREATE_WIDGET, {
      type: response.payload.type,
      roomId: this.core.roomId,
      creationLocation: origin || Origin.NOT_SET,
    });
    // update onboarding
    useOnboarding.getState().api.markComplete('hasCreated');
    // the incoming created message will be handled by the main incoming message
    return response.payload;
  };

  updateWidget = (payload: { widgetId: string; widgetState: Partial<WidgetState> }) => {
    this.core.cacheApi.updateWidget(payload);
    this.core.socket.send({
      kind: 'updateWidget',
      payload,
    });

    Analytics.trackWidgetUpdateEvent(this.core.roomId, payload.widgetState);
  };

  deleteWidget = (payload: { widgetId: string }) => {
    this.core.cacheApi.deleteWidget(payload);
    this.core.socket.send({
      kind: 'deleteWidget',
      payload,
    });
  };
}
