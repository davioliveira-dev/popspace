import { PROMO_SLUGS } from '@constants/promoSlugs';
import { FlaggAdmin } from 'flagg/dist/react';
import * as React from 'react';
import { Route, Switch } from 'react-router-dom';

import { AdminRoute } from './components/AdminRoute/AdminRoute';
import { RouteNames } from './constants/RouteNames';
import { Page } from './Layouts/Page/Page';
import { LandingPage } from './pages/LandingPage';
import { MeetingLink } from './pages/MeetingLink/MeetingLink';
import { MeetingSelect } from './pages/MeetingSelect/MeetingSelect';
import { PostMeeting } from './pages/PostMeeting/PostMeeting';
import { PromoSlugPage } from './pages/PromoSlugPage';
import RoomPage from './pages/RoomPage/RoomPage';

const LicensesPage = React.lazy(() => import('./pages/licenses/LicensesPage'));

export interface IRoutesProps {}

export const Routes: React.FC<IRoutesProps> = () => {
  return (
    <Switch>
      <Route exact path={RouteNames.ROOT}>
        <LandingPage />
      </Route>
      <Route exact path={RouteNames.CREATE_MEETING} component={MeetingSelect} />

      <Route exact path={RouteNames.MEETING_LINK} component={MeetingLink} />

      <AdminRoute
        path={RouteNames.FEATURE_FLAGS}
        render={({ history }) => <FlaggAdmin onDone={() => history.push('/')} />}
      />

      <Route path={RouteNames.LICENSES}>
        <React.Suspense fallback={<Page isLoading />}>
          <LicensesPage />
        </React.Suspense>
      </Route>

      {PROMO_SLUGS.map((slug) => (
        <Route path={`/${slug}`} component={PromoSlugPage} />
      ))}

      <Route path="/:roomRoute/post_meeting" component={PostMeeting} />
      <Route
        path="/:roomRoute"
        render={(renderProps) => {
          return <RoomPage roomRoute={renderProps.match.params.roomRoute} />;
        }}
      />
    </Switch>
  );
};
