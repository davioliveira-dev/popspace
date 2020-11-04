import { createSlice, nanoid, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { EmojiData } from 'emoji-mart';
import { Bounds, Vector2 } from '../../types/spatials';
import { RootState } from '../../state/store';
import { clamp } from '../../utils/math';
import { WidgetState, PersonState, WidgetType, WidgetData } from '../../types/room';
import { MIN_WIDGET_HEIGHT, MIN_WIDGET_WIDTH } from '../../constants/room';
import { BUILT_IN_WALLPAPERS } from '../../constants/wallpapers';

/**
 * Positioning data for an object in a room,
 * along with a reference to the object itself.
 */
export type ObjectPositionData = {
  /**
   * RoomObject positions are in "world space" pixel values - i.e. pixel
   * position based on 100% zoom.
   */
  position: Vector2;
  /**
   * User-resizable objects will need to set their size in state so it can
   * be synchronized with others. Non-user-resizable objects will not define
   * a size, and allow their contents to size themselves.
   */
  size?: Bounds;
};

/**
 * The main state slice for a Room, containing all data important to rendering
 * a Room
 */
interface RoomState {
  widgets: Record<string, WidgetState>;
  people: Record<string, PersonState>;
  /** Position data is keyed on the id of the widget or participant */
  positions: Record<string, ObjectPositionData>;
  bounds: Bounds;
  wallpaperUrl: string;
  useSpatialAudio: boolean;
  isWallpaperModalOpen: boolean;
  isMembershipModalOpen: boolean;
  isUserSettingsModalOpen: boolean;
}

/** Use for testing only, please. */
export const initialState: RoomState = {
  positions: {},
  widgets: {},
  people: {},
  // TODO: make this changeable
  bounds: {
    width: 2400,
    height: 2400,
  },
  wallpaperUrl: BUILT_IN_WALLPAPERS[0],
  useSpatialAudio: true,
  isWallpaperModalOpen: false,
  isMembershipModalOpen: false,
  isUserSettingsModalOpen: false,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    /** adds a widget at the specified position */
    addWidget: {
      // the user is not required to provide an id for a new widget;
      // it will be generated for them in the action preparation step.
      prepare(input: { position: Vector2; size?: Bounds; widget: Omit<WidgetState, 'id'> }) {
        return {
          payload: {
            ...input,
            widget: {
              id: nanoid(),
              ...input.widget,
            } as WidgetState,
          },
        };
      },
      reducer(
        state,
        {
          payload,
        }: PayloadAction<{
          position: Vector2;
          size?: Bounds;
          widget: WidgetState;
        }>
      ) {
        state.positions[payload.widget.id] = {
          position: payload.position,
          size: payload.size,
        };

        state.widgets[payload.widget.id] = payload.widget;
      },
    },
    /** adds a person at the specified position */
    addPerson(
      state,
      {
        payload,
      }: PayloadAction<{
        position: Vector2;
        person: {
          id: string;
          avatar: string;
          emoji?: EmojiData | string;
          status?: string;
        };
      }>
    ) {
      state.positions[payload.person.id] = {
        position: payload.position,
      };

      state.people[payload.person.id] = {
        kind: 'person',
        isSpeaking: false,
        status: null,
        emoji: null,
        isSharingScreen: false,
        ...payload.person,
      };
    },
    removeWidget(state, { payload }: PayloadAction<{ id: string }>) {
      delete state.widgets[payload.id];
      delete state.positions[payload.id];
    },
    removePerson(state, { payload }: PayloadAction<{ id: string }>) {
      delete state.people[payload.id];
      delete state.positions[payload.id];
    },
    /** Updates the position of any object in the room by ID */
    moveObject(state, { payload }: PayloadAction<{ id: string; position: Vector2 }>) {
      if (!state.positions[payload.id]) return;
      // restrict the position to the bounds of the room
      const clamped = {
        x: clamp(payload.position.x, -state.bounds.width / 2, state.bounds.width / 2),
        y: clamp(payload.position.y, -state.bounds.height / 2, state.bounds.height / 2),
      };
      state.positions[payload.id].position = clamped;
    },
    resizeObject(state, { payload }: PayloadAction<{ id: string; size?: Bounds | null }>) {
      if (!state.positions[payload.id]) return;
      if (payload.size) {
        const clamped = {
          width: clamp(payload.size.width, MIN_WIDGET_WIDTH, Infinity),
          height: clamp(payload.size.height, MIN_WIDGET_HEIGHT, Infinity),
        };
        state.positions[payload.id].size = clamped;
      } else {
        state.positions[payload.id].size = undefined;
      }
    },
    /** Updates the data associated with a widget */
    updateWidgetData(state, { payload }: PayloadAction<{ id: string; data: Partial<WidgetData>; publish?: boolean }>) {
      if (!state.widgets[payload.id]) return;
      state.widgets[payload.id].data = {
        ...state.widgets[payload.id].data,
        ...payload.data,
      };
      // if publish is true and we're already a draft,
      // publish it!
      if (payload.publish && state.widgets[payload.id].isDraft) {
        state.widgets[payload.id].isDraft = false;
      }
    },
    /** Changes the emoji displayed for a participant */
    updatePersonStatus(
      state,
      { payload }: PayloadAction<{ id: string; emoji?: EmojiData | string | null; status?: string | null }>
    ) {
      if (!state.people[payload.id]) return;
      if (payload.emoji !== undefined) {
        state.people[payload.id].emoji = payload.emoji;
      }
      if (payload.status !== undefined) {
        state.people[payload.id].status = payload.status;
      }
    },
    /** Changes the avatar displayed for a participant */
    updatePersonAvatar(state, { payload }: PayloadAction<{ id: string; avatar: string }>) {
      if (!state.people[payload.id]) return;
      state.people[payload.id].avatar = payload.avatar;
    },
    updatePersonIsSharingScreen(state, { payload }: PayloadAction<{ id: string; isSharingScreen: boolean }>) {
      if (!state.people[payload.id]) return;
      state.people[payload.id].isSharingScreen = payload.isSharingScreen;
    },
    updateRoomWallpaper(state, { payload }: PayloadAction<{ wallpaperUrl: string }>) {
      state.wallpaperUrl = payload.wallpaperUrl;
    },
    updatePersonIsSpeaking(state, { payload }: PayloadAction<{ id: string; isSpeaking: boolean }>) {
      if (!state.people[payload.id]) return;

      state.people[payload.id].isSpeaking = payload.isSpeaking;
    },
    setIsWallpaperModalOpen(state, { payload }: PayloadAction<{ isOpen: boolean }>) {
      state.isWallpaperModalOpen = payload.isOpen;
    },
    setIsMembershipModalOpen(state, { payload }: PayloadAction<{ isOpen: boolean }>) {
      state.isMembershipModalOpen = payload.isOpen;
    },
    setIsUserSettingsModalOpen(state, { payload }: PayloadAction<{ isOpen: boolean }>) {
      state.isUserSettingsModalOpen = payload.isOpen;
    },
    /**
     * !! never call this with coordinated dispatch - only ever
     * use regular dispatch - clears local room state after leaving!
     */
    leave() {
      return initialState;
    },
  },
});

export const { actions, reducer } = roomSlice;

const selectWidgets = (state: RootState) => state.room.widgets;
const selectPeople = (state: RootState) => state.room.people;

export const selectors = {
  createPositionSelector: (objectId: string) => (state: RootState) => state.room.positions[objectId]?.position || null,
  // memoized so that an identical widgets map doesn't produce different arrays from Object.keys
  selectWidgetIds: createSelector(selectWidgets, (widgets) => Object.keys(widgets)),
  createWidgetSelector: (widgetId: string) => (state: RootState) => state.room.widgets[widgetId] || null,
  // memoized so that an identical people map doesn't produce different arrays from Object.keys
  selectPeopleIds: createSelector(selectPeople, (people) => Object.keys(people)),
  createPersonSelector: (participantId: string) => (state: RootState) => state.room.people[participantId] || null,
  selectRoomBounds: (state: RootState) => state.room.bounds,
  selectHasWhiteboard: (state: RootState) =>
    Object.values(state.room.widgets).some((widget) => widget.type === WidgetType.Whiteboard),
  selectWallpaperUrl: (state: RootState) => state.room.wallpaperUrl,
  createEmojiSelector: (personId: string) => (state: RootState) => state.room.people[personId]?.emoji,
  selectUseSpatialAudio: (state: RootState) => state.room.useSpatialAudio,
  createPersonAvatarSelector: (personId: string) => (state: RootState) => state.room.people[personId]?.avatar,
  createPersonIsSpeakingSelector: (personId: string) => (state: RootState) => !!state.room.people[personId]?.isSpeaking,
  selectIsWallpaperModalOpen: (state: RootState) => state.room.isWallpaperModalOpen,
  selectIsMembershipModalOpen: (state: RootState) => state.room.isMembershipModalOpen,
  selectIsUserSettingsModalOpen: (state: RootState) => state.room.isUserSettingsModalOpen,
};
