import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import Api from '../../utils/api';
import * as Sentry from '@sentry/react';
import { CircularProgress, Link } from '@material-ui/core';
import { Routes } from '../../constants/Routes';
import { Links } from '../../constants/Links';
import { USER_SESSION_TOKEN } from '../../constants/User';

import { DashboardItem } from './DashboardItem/DashboardItem';
import { RoomSummary } from './RoomSummary/RoomSummary';
import { Header } from '../../withComponents/Header/Header';
import { RoomInfo } from '../../types';
import { ErrorPage } from '../ErrorPage/ErrorPage';
import { ErrorTypes } from '../../constants/ErrorType';
import { ErrorInfo, UserInfo } from '../../types';
import { sessionTokenExists } from '../../utils/SessionTokenExists';
import { Button } from '@material-ui/core';
import { WithModal } from '../../withComponents/WithModal/WithModal';

import styles from './Dashboard.module.css';

interface IDashboardProps {}

export const Dashboard: React.FC<IDashboardProps> = (props) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(sessionTokenExists(localStorage.getItem(USER_SESSION_TOKEN)));
  const [error, setError] = useState<ErrorInfo>(null!);
  const [user, setUser] = useState<UserInfo>(null!);
  const [rooms, setRooms] = useState<{ owned: RoomInfo[]; member: RoomInfo[] }>({ owned: [], member: [] });
  const [errorMsg, setErrorMsg] = useState<string>('');

  // run this on mount
  useEffect(() => {
    const sessionToken = localStorage.getItem(USER_SESSION_TOKEN);
    if (sessionTokenExists(sessionToken)) {
      // TODO: replace this with the updated api
      // Fix typing
      Api.getProfile(sessionToken)
        .then((result: any) => {
          if (result.success) {
            // this means we have a valid token
            setIsLoading(false);
            setUser(result.profile.user);
            setRooms(result.profile.rooms);
          } else {
            // we dont have a valid token, so redirect to sign in and remove old token
            localStorage.removeItem(USER_SESSION_TOKEN);
            history.push(Routes.SIGN_IN);
          }
        })
        .catch((e: any) => {
          setIsLoading(false);
          Sentry.captureMessage(`Error calling api call getProfile`, Sentry.Severity.Error);
          setError({
            errorType: ErrorTypes.UNEXPECTED,
            error: e,
          });
        });
    } else {
      // we arent logged in so redirect to the sign in page
      history.push(Routes.SIGN_IN);
    }
  }, [history]);

  const feedbackItem = (
    <DashboardItem>
      <div
        className={clsx(
          styles.feedbackTextWrapper,
          'u-height100Percent u-flex u-flexCol u-flexJustifyCenter u-flexAlignItemsCenter'
        )}
      >
        <div className="u-fontP1">
          You will soon have the ability to create new rooms, rename rooms, and delete rooms.
        </div>
        <div className={styles.feedbackLink}>
          <Link href={Links.FEEDBACK} target="_blank" rel="noopener noreferrer">
            Give us feedback
          </Link>
        </div>
      </div>
    </DashboardItem>
  );

  const onRoomSummaryError = (errorMsg: string) => {
    setErrorMsg(errorMsg);
  };

  return error ? (
    <ErrorPage type={error.errorType} errorMessage={error.error?.message} />
  ) : (
    <main className={clsx(styles.root, 'u-height100Percent')}>
      {isLoading ? (
        <div className="u-flex u-flexJustifyCenter u-flexAlignItemsCenter  u-height100Percent">
          <CircularProgress />
        </div>
      ) : (
        <div className="u-flex u-flexJustifyCenter u-height100Percent">
          <div className={clsx(styles.wrapper, 'u-flex u-flexCol u-size4of5')}>
            <Header isFullLength={true} userName={user ? user['first_name'] : ''} />
            <div className={clsx(styles.bgContainer, 'u-height100Percent')}>
              <div className={clsx(styles.text, 'u-fontH1')}>Your rooms</div>
              <div className={clsx('u-width100Percent')}>
                <div className={clsx(styles.roomGrid, 'u-height100Percent')}>
                  {[...rooms.owned, ...rooms.member].map((memberRoom) => {
                    return (
                      <DashboardItem key={memberRoom.id}>
                        <RoomSummary
                          roomName={memberRoom.name}
                          key={memberRoom.id}
                          onErrorHandler={onRoomSummaryError}
                        />
                      </DashboardItem>
                    );
                  })}
                  {feedbackItem}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <WithModal isOpen={!!errorMsg}>
        <div className="u-flex u-flexCol">
          <h1 className="u-fontH1">A sidenote</h1>
          <p className="u-fontP1">{errorMsg}</p>
        </div>
        <div className="u-flexExpandTop">
          <Button onClick={() => setErrorMsg('')}>Got it</Button>
        </div>
      </WithModal>
    </main>
  );
};
