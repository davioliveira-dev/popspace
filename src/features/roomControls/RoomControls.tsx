import * as React from 'react';
import { makeStyles } from '@material-ui/core';
import { RoomMenu } from './roomMenu/RoomMenu';
import { RoomTaskbar } from './taskbar/RoomTaskbar';
import { ActionBar } from './addContent/ActionBar';
import { ViewportControls } from './viewport/ViewportControls';
import { Spacing } from '../../components/Spacing/Spacing';
import { ExperimentsModal } from './experiments/ExperimentsModal';

export interface IRoomControlsProps {}

const useStyles = makeStyles((theme) => ({
  roomAndViewportControls: {
    position: 'fixed',
    right: theme.spacing(2),
    top: theme.spacing(2),
    pointerEvents: 'none',
    '& > *': {
      pointerEvents: 'initial',
    },
  },
}));

export const RoomControls = React.memo<IRoomControlsProps>(() => {
  const classes = useStyles();

  return (
    <>
      <RoomTaskbar />
      <Spacing flexDirection="row" className={classes.roomAndViewportControls}>
        <RoomMenu />
        <ViewportControls />
      </Spacing>
      <ActionBar />
      <ExperimentsModal />
    </>
  );
});
