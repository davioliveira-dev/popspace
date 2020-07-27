import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import { Emoji } from 'emoji-mart';

import './index.css';

import { ReactComponent as SettingsIcon } from '../../images/icons/settings.svg';
import { ReactComponent as ScreenShareIcon } from '../../images/icons/ScreenShare.svg';
import { ReactComponent as ScreenUnshareIcon } from '../../images/icons/screen_share_stop.svg';

import { AudioToggle } from '../AudioToggle/AudioToggle';
import { VideoToggle } from '../VideoToggle/VideoToggle';

import SettingsModal from '../SettingsModal/SettingsModal';

import Publication from '../../components/Publication/Publication';
import usePublications from '../../hooks/usePublications/usePublications';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import useLocalAudioToggle from '../../hooks/useLocalAudioToggle/useLocalAudioToggle';
import useParticipantDisplayIdentity from '../../withHooks/useParticipantDisplayIdentity/useParticipantDisplayIdentity';

import { LocalParticipant, RemoteParticipant, Track } from 'twilio-video';

import { useParticipantMetaContext } from '../ParticipantMetaProvider/useParticipantMetaContext';
import { useParticipantMeta } from '../../withHooks/useParticipantMeta/useParticipantMeta';
import { useAvatar } from '../../withHooks/useAvatar/useAvatar';

import { Avatar } from '../Avatar/Avatar';

import useScreenShareToggle from '../../hooks/useScreenShareToggle/useScreenShareToggle';

interface ParticipantCircleProps {
  participant: LocalParticipant | RemoteParticipant;
  disableAudio?: boolean;
  enableScreenShare?: boolean;
  videoPriority?: Track.Priority;
  onClick: () => void;
  style?: { [key: string]: string | number };
}

const ParticipantCircle = (props: ParticipantCircleProps) => {
  const sharedScreenBtnRef = useRef<HTMLDivElement>(null);
  const { participant, disableAudio, enableScreenShare, videoPriority, onClick, style = {} } = props;
  const meta = useParticipantMeta(participant);
  const [isAudioEnabled] = useLocalAudioToggle();
  const [isHovering, setIsHovering] = useState(false);
  const [isHoveringOverSettings, setIsHoveringOverSettings] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { updateEmoji, updateScreenViewSid } = useParticipantMetaContext();
  const { room } = useVideoContext();
  const publications = usePublications(participant);
  const isLocal = participant === room.localParticipant;

  const participantDisplayIdentity = useParticipantDisplayIdentity(participant);
  const { emoji, avatar: avatarName, isSpeaking } = meta;
  const avatar = useAvatar(avatarName);

  let filteredPublications;

  if (enableScreenShare && publications.some(p => p.trackName === 'screen')) {
    filteredPublications = publications.filter(p => p.trackName !== 'camera');
  } else {
    filteredPublications = publications.filter(p => p.trackName !== 'screen');
  }

  // only local participant can see gear icon to open settings
  let settings = null;
  if (isLocal || emoji) {
    settings = (
      <div
        className={clsx(
          'ParticipantCircle-settings u-layerSurfaceAlpha u-flex u-flexAlignItemsCenter u-flexJustifyCenter ParticipantCircle-menuItem ',
          {
            'is-set': emoji,
          }
        )}
        onClick={e => {
          e.stopPropagation();
          openSettingsModal();
        }}
        onMouseEnter={() => setIsHoveringOverSettings(true)}
        onMouseLeave={() => setIsHoveringOverSettings(false)}
      >
        {emoji ? (
          isHoveringOverSettings && isLocal ? (
            <SettingsIcon />
          ) : (
            <Emoji emoji={emoji} size={24} />
          )
        ) : (
          <SettingsIcon />
        )}
      </div>
    );
  }

  const [, toggleIsSharing] = useScreenShareToggle();
  const screenShareTrack = publications.find(pub => pub.trackName === 'screen');

  let screenShare = null;

  if (isLocal) {
    screenShare = (
      <div
        className={clsx(
          'ParticipantCircle-screenShare u-layerSurfaceAlpha u-flex u-flexAlignItemsCenter u-flexJustifyCenter ParticipantCircle-menuItem',
          { 'is-active': !!screenShareTrack }
        )}
        onClick={e => {
          e.stopPropagation();
          toggleIsSharing();
        }}
      >
        {!!screenShareTrack ? <ScreenUnshareIcon /> : <ScreenShareIcon />}
      </div>
    );
  } else if (screenShareTrack) {
    screenShare = (
      <div
        ref={sharedScreenBtnRef}
        className="ParticipantCircle-screenSharePreview u-layerSurfaceAlpha u-flex u-flexAlignItemsCenter u-flexJustifyCenter"
        onClick={e => {
          e.stopPropagation();
          updateScreenViewSid(participant.sid);
        }}
      >
        <Publication publication={screenShareTrack} participant={participant} isLocal={isLocal} />
      </div>
    );
  }

  function openSettingsModal() {
    // only the local participant can open their settings
    if (isLocal) {
      setIsSettingsModalOpen(true);
    }
  }

  function closeSettingsModal() {
    setIsSettingsModalOpen(false);
  }

  // `hasVideoPublication` can be used to change the circle's appearance. Below, if there is no video publication
  // an Avatar is rendered.
  let hasVideoPublication = false;
  const pubs = filteredPublications.map(publication => {
    if (publication.kind === 'video') {
      hasVideoPublication = true;
    }
    return (
      <div key={publication.kind + publication.trackSid} className="ParticipantCircle-participant">
        <Publication
          publication={publication}
          participant={participant}
          isLocal={isLocal}
          disableAudio={disableAudio}
          videoPriority={videoPriority}
          classNames={'ParticipantCircle-videoCircle'}
        />
      </div>
    );
  });

  const styles = {
    backgroundColor: avatar?.backgroundColor,
    borderColor: isSpeaking ? '#b9c5ff' : avatar?.backgroundColor,
    ...style,
  };

  return (
    <>
      <div
        className={clsx('ParticipantCircle u-flex u-flexJustifyCenter', {
          'is-localParticipant': isLocal,
          'is-speaking': isSpeaking,
        })}
        style={styles}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => onClick()}
      >
        {hasVideoPublication ? null : (
          <div className="ParticipantCircle-avatar">
            <Avatar name={avatarName} />
          </div>
        )}
        {settings}
        {screenShare}
        {pubs}
        <div
          className={clsx('ParticipantCircle-infoOverlay', {
            'is-hovering': isHovering || disableAudio,
            'is-light': hasVideoPublication,
          })}
        >
          <div className={clsx('ParticipantCircle-overLayText', { 'is-light': hasVideoPublication })}>
            {participantDisplayIdentity}
          </div>
        </div>
        {isLocal ? (
          <div
            className="ParticipantCircle-hud u-layerSurfaceAlpha u-flex u-flexJustifyCenter u-positionAbsolute u-width100Percent"
            onClick={e => {
              e.stopPropagation();
            }}
          >
            <div className="ParticipantCircle-hud-item ParticipantCircle-menuItem">
              <VideoToggle compact={true} border={false} />
            </div>
            <div
              className={clsx('ParticipantCircle-hud-item ParticipantCircle-menuItem', { 'is-shown': !isAudioEnabled })}
            >
              <AudioToggle border={false} />
            </div>
          </div>
        ) : null}
      </div>
      {isLocal ? (
        <SettingsModal
          isSettingsModalOpen={isSettingsModalOpen}
          closeSettingsModal={closeSettingsModal}
          updateEmoji={updateEmoji}
          emoji={emoji}
          participant={participant}
        />
      ) : null}
    </>
  );
};

export default ParticipantCircle;
