import React, { useEffect, useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import io from 'socket.io-client';
import './index.css';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone } from 'react-icons/fa';

const VideoConsultation = ({ isDoctor }) => {
    const { meeting_id } = useParams();
    const history = useHistory();
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerConnectionRef = useRef();
    const socketRef = useRef();

    useEffect(() => {
        let stream = null;

        const init = async () => {
            try {
                // 1. Get local media stream
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                console.log('Patient: Local stream obtained');
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // 2. Create peer connection
                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        {
                            urls: 'turn:numb.viagenie.ca',
                            username: 'webrtc@live.com',
                            credential: 'muazkh'
                        }
                    ]
                });

                // Add local stream tracks to peer connection
                stream.getTracks().forEach(track => {
                    console.log('Patient: Adding track to peer connection');
                    pc.addTrack(track, stream);
                });

                // Handle incoming stream
                pc.ontrack = (event) => {
                    console.log('Patient: Received remote track');
                    if (remoteVideoRef.current && event.streams[0]) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                // ICE candidate handling
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log('Patient: Sending ICE candidate');
                        socketRef.current.emit('ice-candidate', {
                            candidate: event.candidate,
                            meeting_id
                        });
                    }
                };

                pc.oniceconnectionstatechange = () => {
                    console.log('Patient ICE Connection State:', pc.iceConnectionState);
                };

                peerConnectionRef.current = pc;

                // 3. Set up socket connection
                socketRef.current = io('https://backend-diagno.onrender.com', {
                    transports: ['websocket']
                });

                socketRef.current.on('connect', () => {
                    console.log('Patient: Socket connected');
                    socketRef.current.emit('join-room', { meeting_id, isDoctor: false });
                });

                socketRef.current.on('user-connected', async () => {
                    console.log('Patient: Doctor connected, creating offer');
                    try {
                        const offer = await pc.createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        });
                        await pc.setLocalDescription(offer);
                        console.log('Patient: Sending offer');
                        socketRef.current.emit('offer', { offer, meeting_id });
                    } catch (err) {
                        console.error('Patient: Error creating offer:', err);
                    }
                });

                socketRef.current.on('answer', async (answer) => {
                    console.log('Patient: Received answer');
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    } catch (err) {
                        console.error('Patient: Error setting remote description:', err);
                    }
                });

                socketRef.current.on('ice-candidate', async (candidate) => {
                    try {
                        if (pc.remoteDescription) {
                            console.log('Patient: Adding ICE candidate');
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        }
                    } catch (err) {
                        console.error('Patient: Error adding ICE candidate:', err);
                    }
                });

            } catch (err) {
                console.error('Patient: Error initializing:', err);
                setError(err.message);
            }
        };

        init();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [meeting_id]);

    const handleEndCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        socketRef.current.disconnect();
        history.push('/');
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    if (error) {
        return (
            <div className="video-consultation-container error-state">
                <div className="error-container">
                    <h2>Connection Error</h2>
                    <p>{error}</p>
                    <button className="end-call" onClick={() => history.push('/')}>
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="video-consultation-container">
            <div className="consultation-header">
                <div className="consultation-info">
                    <h2>{isDoctor ? 'Patient Consultation' : 'Doctor Consultation'}</h2>
                    <div className="consultation-status">
                        <div className="status-indicator"></div>
                        <span>{connectionStatus}</span>
                    </div>
                </div>
                <div className="meeting-id">
                    Meeting ID: {meeting_id}
                </div>
            </div>

            <div className="video-grid">
                <div className="main-video-container">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="remote-video"
                    />
                </div>
                <div className="local-video-container">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="local-video"
                    />
                </div>
            </div>

            <div className="controls">
                <button 
                    className="control-button mic-button"
                    onClick={toggleMute}
                >
                    {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>
                <button 
                    className="control-button camera-button"
                    onClick={toggleVideo}
                >
                    {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
                </button>
                <button className="control-button end-call" onClick={handleEndCall}>
                    <FaPhone style={{ transform: 'rotate(135deg)' }} />
                </button>
            </div>
        </div>
    );
};

export default VideoConsultation;