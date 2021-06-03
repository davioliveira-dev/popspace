import * as React from 'react';
import { RouteNames } from './constants/RouteNames';
import { Signin } from './pages/SignIn/Signin';
import { LoginWithEmail } from './pages/LoginWithEmail/LoginWithEmail';
import { VerifyEmail } from './pages/VerifyEmail/VerifyEmail';
import { Subscribe } from './pages/Subscribe/Subscribe';
import { Unsubscribe } from './pages/Unsubscribe/Unsubscribe';
import { Route, Switch } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute/AdminRoute';
import { FlaggAdmin } from 'flagg/dist/react';
import { Page } from './Layouts/Page/Page';
import { AuthenticatedRoute } from './components/AuthenticatedRoute/AuthenticatedRoute';
import RoomPage from './pages/RoomPage/RoomPage';
import { Signup } from './pages/Signup/Signup';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { MeetingLink } from './pages/MeetingLink/MeetingLink';
const LicensesPage = React.lazy(() => import('./pages/licenses/LicensesPage'));

export interface IRoutesProps {}

export const Routes: React.FC<IRoutesProps> = (props) => {
  return (
    <Switch>
      {/* TODO: open this to anon users */}
      <AuthenticatedRoute exact path={RouteNames.ROOT}>
        <Dashboard />
      </AuthenticatedRoute>

      <AuthenticatedRoute exact path={RouteNames.MEETING_LINK}>
        <MeetingLink />
      </AuthenticatedRoute>

      <Route exact path={RouteNames.SIGN_IN}>
        <Signin />
      </Route>

      <Route exact path={RouteNames.SIGN_UP}>
        <Signup />
      </Route>

      <Route path={RouteNames.COMPLETE_SIGNUP}>
        <VerifyEmail />
      </Route>

      <Route path={RouteNames.LOGIN_IN_WITH_EMAIL}>
        <LoginWithEmail />
      </Route>

      <AdminRoute
        path={RouteNames.FEATURE_FLAGS}
        render={({ history }) => <FlaggAdmin onDone={() => history.push('/')} />}
      />

      <Route path={RouteNames.SUBSCRIBE}>
        <Subscribe />
      </Route>

      <Route path={RouteNames.UNSUBSCRIBE}>
        <Unsubscribe />
      </Route>

      <Route path={RouteNames.LICENSES}>
        <React.Suspense fallback={<Page isLoading />}>
          <LicensesPage />
        </React.Suspense>
      </Route>

      {/* TODO: open this to anon users */}
      <AuthenticatedRoute
        path="/:roomRoute"
        render={(renderProps) => {
          return <RoomPage name={renderProps.match.params.roomRoute} />;
        }}
      />
    </Switch>
  );
};
