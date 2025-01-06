import {Component} from "react"
import Cookies from "js-cookie"
import {Redirect} from "react-router-dom"
import {Link} from "react-router-dom"
import "./UserLogin.css"

class LoginForm extends Component {
  state = {
    username: "",
    password: "",
    errorMsg: "",
    showError: false
  }
//
  onSubmitSuccess = (data) => {
    const {history} = this.props


   
    // Save token to cookies
    Cookies.set('jwt_token', data.jwt_token, {
      expires: 30,
    
    })
    let id = data.user.id;
    localStorage.setItem('userDetails',JSON.stringify(data.user))
    localStorage.setItem('userData', JSON.stringify(id))
    history.push("/")
  }

  submitForm = async event => {
    event.preventDefault()
    const {username, password} = this.state
    
    const userDetails = {username, password}
    const url = 'http://localhost:3009/api/login'
                
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userDetails),
      })
     
      console.log('Login Response:', response);
      const data = await response.json()
      console.log('Login Data:', data);
      
      if (response.ok) {
        this.onSubmitSuccess(data)
      
      } else {
        this.setState({
          showError: true,
          errorMsg: data.error || 'Invalid credentials'
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      this.setState({
        showError: true,
        errorMsg: 'Connection error. Please try again.'
      })
    }
  }

  onChangeUsername = event => {
    this.setState({username: event.target.value})
  }

  onChangePassword = event => {
    this.setState({password: event.target.value})
  }

  render() {
    const {username, password, showError, errorMsg} = this.state
    const jwtToken = Cookies.get('jwt_token')
    
    if (jwtToken !== undefined) {
      return <Redirect to="/" />
    }
    
    return (
      <div className="main-bg-container-for-login">
        <img 
          alt="logo" 
          className="login-image" 
          src="https://res.cloudinary.com/dbroxheos/image/upload/v1727454124/Untitled_design_1_nyltzm.png" 
        />
        <div className="login-container">
          <img 
            alt="logo" 
            className="image" 
            src="https://res.cloudinary.com/dbroxheos/image/upload/v1727450617/gdyevtkkyx2gplt3c0kv.png" 
          />
          <h1 className="sign-in-heading">Sign In</h1>
          <form className="form-container" onSubmit={this.submitForm}>
            <div className="container">
              <label className="label" htmlFor="username">Username</label>
              <input 
                value={username} 
                onChange={this.onChangeUsername} 
                placeholder="Username" 
                id="username" 
                type="text" 
                className="input-text" 
              />
            </div>

            <div className="container">
              <label className="label" htmlFor="password">Password</label>
              <input 
                value={password} 
                onChange={this.onChangePassword}
                placeholder="Password" 
                id="password" 
                type="password" 
                className="input-text" 
              />
            </div>

            {showError && <p className="error-message">{errorMsg}</p>}
            
            <button className="button" type="submit">Sign In</button>
            <Link to="/signup" className="link">
              <p className="sign-up-heading">Don't have an account? Sign Up</p>
            </Link>
          </form>
        </div>
      </div>
    )
  }
}

export default LoginForm