"use client"

// react and nextjs imports
import { useEffect, useState } from "react";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import axios from "axios";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input";

// lucide-react icon miports
import { CircleUserRound } from "lucide-react";

// user-defined imports
import { getSpotifyAuthLink, requestToken } from "@/app/spotify.js";
import "@/app/globals.css";

const PROFILE_URL = "https://api.spotify.com/v1/me";
const GET_PLAYLISTS_URL = "https://api.spotify.com/v1/me/playlists";

const MAX_DESC_LEN = 50;

const Heading = () => {
  return (
    <div>
      <h1 className="font-black text-2xl text-center">Playlist Curator</h1>
      <p>Lorem ipsum dolor si amet.</p>
    </div>
  );
}; /* Heading() */

const SpotifyAccount = ({ onLoginAttempt, onValueChange, token }) => {
  interface Playlist {
    name: string;
    song_count: number;
    api_endpoint: string;
    tracks: Array<string>;
  };

  const [username, setUsername] = useState<string>();
  const [playlists, setPlaylists] = useState<Array<Playlist>>();

  const [showPlaylists, setShowPlaylists] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const payload = {headers: {Authorization: `Bearer ${token}`}};

      try {
        const profileResponse = await axios.get(PROFILE_URL, payload);
        setUsername(profileResponse.data.display_name);
        
        const playlistsResponse = await axios.get(GET_PLAYLISTS_URL, payload);
        let list = [];

        for (let item of playlistsResponse.data.items) {
          list.push({
            name: item.name,
            song_count: item.tracks.total,
            api_endpoint: item.tracks.href,
            tracks: [],
          });
        }

        setPlaylists(list);
        setShowPlaylists(true);
      } catch (err) {
        console.error(err);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  if (showPlaylists) {
    return (
      <div>
        <p>Signed in as {username}</p>
        <RadioGroup onValueChange={(value) => onValueChange(value)}>
          {playlists.map((item, index) => {
            const optionId = "playlist" + index;

            return (
              <div key={index}>
                <RadioGroupItem value={item.api_endpoint} id={optionId} />
                <Label htmlFor={optionId}>{item.name} ({item.song_count} songs)</Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    );
  }

  return (
    <div>
      <Button variant="spotify"
              onClick={onLoginAttempt}
              className="m-auto text-xl w-5xl p-8">
        <CircleUserRound />
        Sign in to Spotify
      </Button>
    </div>
  );
}; /* SpotifyAccount() */

const InputForm = ({ onLoginAttempt, onSubmit, token }) => {
  const [playlist, setPlaylist] = useState<string>();
  const [description, setDescription] = useState<string>();

  const updatePlaylist = (value) => {
    setPlaylist(value);
  };

  const updateDescription = (event) => {
    setDescription(event.target.value);
  };

  const extractButtonHandler = (event) => {
    if (!playlist || !description) {
      console.log("All fields are required");
      return;
    }

    if (description.length > MAX_DESC_LEN) {
      console.log("Description is too long");
      return;
    }

    const data = { playlist, description };
    onSubmit(data);
  };

  return (
    <div>
      <SpotifyAccount onLoginAttempt={onLoginAttempt}
                      onValueChange={updatePlaylist}
                      token={token} />

      <Label htmlFor="description">I want all the songs that are...</Label>
      <Input id="description"
             name="description"
             placeholder="happy" 
             onChange={(e) => setDescription(e.target.value)} />

      <Button onClick={extractButtonHandler}>Extract</Button>
    </div>
  );
}; /* InputForm() */

const Editor = () => {
  return (<div>what</div>);
}; /* Editor() */

const Program = () => {
  const [params, setParams] = useSearchParams();
  
  const [accessToken, setAccessToken] = useState<string>();
  const [refreshToken, setRefreshToken] = useState<string>();

  const [showEditor, setShowEditor] = useState<boolean>(false);

  const loginHandler = async () => {
    window.location.href = await getSpotifyAuthLink();
  };

  useEffect(() => {
    const fetchToken = async () => {
      let code = params.get("code");
      
      if (code) {
        const data = await requestToken(code);
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
      }
    };

    fetchToken();
  }, []);

  const sendExtractRequest = async (data) => {
    const payload = {headers: {Authorization: `Bearer ${accessToken}`}};

    try {
      const response = await axios.get(data.playlist, payload);
      const tracks = [];

      for (let item of response.data.items) {
        tracks.push(item.track.id);
      }
    } catch (err) {
      console.error(err);
    }

    console.log("submit");
  };

  return (
    <div>
      <Heading />

      { !showEditor && <InputForm onLoginAttempt={loginHandler}
                                  onSubmit={sendExtractRequest}
                                  token={accessToken} /> }
      { showEditor && <Editor /> }
    </div>
  );
}; /* Program() */

const MainPage = () => {
  return (
    <div>
      <BrowserRouter>
        <Program />
      </BrowserRouter>
    </div>
  );
}; /* MainPage() */

export default MainPage;
