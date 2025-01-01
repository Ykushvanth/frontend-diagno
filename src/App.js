import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import UserLogin from './components/UserLogin/UserLogin';
import UserSignUp from './components/UserSignUp/UserSignUp';
import Home from './components/Home/Home';
import AboutUs from './components/Aboutus/Aboutus';
import Services from './components/services/services';
import Analyse from './components/AnalyseReports/Analyse';
import XrayReport from './components/XrayReport';
import BookingHistory from './components/BookingHistory';
import Appointments from './components/Appointments';
import Cookies from 'js-cookie';
import Profile from './components/Profile';

import './App.css';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const token = Cookies.get('jwt_token');
  return (
    <Route
      {...rest}
      render={props =>
        token ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

const App = () => {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/login">
            {Cookies.get('jwt_token') ? <Redirect to="/home" /> : <UserLogin />}
          </Route>
          <Route exact path="/signup" component={UserSignUp} />
          <PrivateRoute exact path="/home" component={Home} />
          <PrivateRoute exact path="/profile" component={Profile} />
          <PrivateRoute exact path="/about-us" component={AboutUs} />
          <PrivateRoute exact path="/services" component={Services} />
          <Route exact path="/x-ray-reports" component={XrayReport} />
          <Route exact path="/appointments" component={Appointments} />
          <Route exact path="/booking-history" component={BookingHistory} />
          <PrivateRoute exact path="/analyse-report" component={Analyse} />
          <Route exact path="/">
            {Cookies.get('jwt_token') ? <Redirect to="/home" /> : <Redirect to="/login" />}
          </Route>
        </Switch>
      </Router>
    </div>
  );
};

export default App;
//