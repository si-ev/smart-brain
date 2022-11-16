import React, { Component } from 'react';
import Particles from 'react-particles'; // Instead of 'react-particles-js'
import { loadFull } from 'tsparticles';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Navigation from './components/Navigation/Navigation';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import Modal from './components/Modal/Modal';
import Profile from './components/Profile/Profile';
import './App.css';
 
const particlesOptions = {
  fullScreen: {
    enable: true,
    zIndex: 100
  },
  particles: {
    preset: "Links",
    move: {
      enable: true,
    },
    shape: {
      type: "square",
    },
    links: {
      enable: true,
    },
    number: {
      value: 30,
      density: {
        enable: true,
        value_area: 800
      }
    }
  },
  interactivity: {
        detectsOn: "window",
        events: {
          onclick: {
            enable: true,
            mode: "push"
          },
          onhover: {
            enable: true,
            mode: "trail"
          },
          resize: true
        },
        modes: {
            push: {
                particles_nb: 4
            }
        },
  }
}

const initialState = {
  input: 'https://scientificrussia.ru/images/m/6nm-large.jpg',
  imageUrl: '',
  boxes: [],
  route: 'signin',  // Just for development
  isSignedIn: false, // Just for development 
  isProfileOpen: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',
    pet: '',
    age: ''
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = initialState;

  }

  componentDidMount(){
    const token = window.sessionStorage.getItem('token');
    if (token){
        fetch('http://localhost:3000/signin', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        })
        .then(resp => resp.json()) 
        .then(data => {
            if (data && data.id){
                fetch(`http://localhost:3000/profile/${data.id}`, {
                    method: 'get',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    }
                })
                .then(resp => resp.json())
                .then(user => {
                    if (user && user.email){
                        this.loadUser(user);
                    }
                });
            }
        })
        .catch(err => console.log(err));
    }
  }

  customInit = async (engine) => {
      ///await loadLinksPreset(engine);
      await loadFull(engine);
  }
  

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }

  calculateFaceLocation = (data) => {
    if (data && data.outputs){
        const image = document.getElementById('inputimage');
        const width = Number(image.width);
        const height = Number(image.height);

        const boxes = data.outputs[0].data.regions.map((region) => {
            const box = region.region_info.bounding_box;
            return {
              leftCol: box.left_col * width,
              topRow: box.top_row * height,
              rightCol: width - (box.right_col * width),
              bottomRow: height - (box.bottom_row * height)
            }
        });
        
        return boxes;
    }
    return;
  }

  displayFaceBox = (boxes) => {
    if (boxes){
        this.setState({boxes: boxes});
    }
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
      fetch('http://localhost:3000/imageurl', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': window.sessionStorage.getItem('token') 
        },
        body: JSON.stringify({
          input: this.state.input
        })
      })
      .then(response => response.json())
      .then(response => {
        if (response) {
          fetch('http://localhost:3000/image', {
            method: 'put',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': window.sessionStorage.getItem('token') 
            },
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count}))
            })
            .catch(error => console.log(error))
        }
        this.displayFaceBox(this.calculateFaceLocation(response))
      })
      .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      return this.setState(initialState) // Just for development? 
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  toggleModal = () => {
    this.setState(prevState => ({
      ...prevState, // This is optional
      isProfileOpen: !prevState.isProfileOpen
    }));
  }

  render() {
    const { isSignedIn, imageUrl, route, boxes, isProfileOpen, user } = this.state;
    return (
      <div className="App">
         <Particles className='particles'
          options={particlesOptions}
          init={this.customInit}
        />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}
          toggleModal={this.toggleModal}
        />
        { isProfileOpen && 
          <Modal>
            <Profile 
               isProfileOpen={isProfileOpen} 
               toggleModal={this.toggleModal} 
               loadUser={this.loadUser}
               user={user}
            />
          </Modal> 
        }
        { route === 'home'
          ? <div>
              <Logo />
              <Rank
                name={this.state.user.name}
                entries={this.state.user.entries}
              />
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
              />
              <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
            </div>
          : (
             route === 'signin'
             ? <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
             : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
            )
        }
      </div>
    );
  }
}

export default App;
