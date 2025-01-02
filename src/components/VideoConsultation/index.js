import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './index.css';

const VideoConsultation = ({ appointmentId, doctorId, userId }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerConnectionRef = useRef();
    const socketRef = useRef();

    useEffect(() => {
        // Connect to signaling server
        socketRef.current = io('http://localhost:3009');

        // Initialize WebRTC
        initializeWebRTC();

        // Cleanup on component unmount
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const initializeWebRTC = async () => {
        try {
            // Get local media stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);
            localVideoRef.current.srcObject = stream;

            // Initialize peer connection
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    {
                        urls: 'turn:your-turn-server.com',
                        username: 'username',
                        credential: 'credential'
                    }
                ]
            };

            peerConnectionRef.current = new RTCPeerConnection(configuration);

            // Add local stream to peer connection
            stream.getTracks().forEach(track => {
                peerConnectionRef.current.addTrack(track, stream);
            });

            // Handle incoming remote stream
            peerConnectionRef.current.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
                remoteVideoRef.current.srcObject = event.streams[0];
            };

            // Handle ICE candidates
            peerConnectionRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socketRef.current.emit('ice-candidate', {
                        candidate: event.candidate,
                        appointmentId
                    });
                }
            };

            // Socket event handlers
            socketRef.current.on('offer', handleOffer);
            socketRef.current.on('answer', handleAnswer);
            socketRef.current.on('ice-candidate', handleIceCandidate);

            // Join appointment room
            socketRef.current.emit('join-room', { appointmentId, userId, doctorId });

        } catch (err) {
            setError('Failed to access camera/microphone: ' + err.message);
            console.error('WebRTC initialization error:', err);
        }
    };

    const handleOffer = async (offer) => {
        try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            socketRef.current.emit('answer', { answer, appointmentId });
        } catch (err) {
            console.error('Error handling offer:', err);
        }
    };

    const handleAnswer = async (answer) => {
        try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
            console.error('Error handling answer:', err);
        }
    };

    const handleIceCandidate = async (iceCandidate) => {
        try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(iceCandidate));
        } catch (err) {
            console.error('Error handling ICE candidate:', err);
        }
    };

    return (
        <div className="video-consultation-container">
            <div className="video-grid">
                <div className="video-wrapper local">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="local-video"
                    />
                    <div className="controls">
                        <button onClick={() => {/* Toggle mic */}}>
                            Mic
                        </button>
                        <button onClick={() => {/* Toggle camera */}}>
                            Camera
                        </button>
                        <button onClick={() => {/* End call */}}>
                            End
                        </button>
                    </div>
                </div>
                <div className="video-wrapper remote">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="remote-video"
                    />
                </div>
            </div>
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default VideoConsultation;