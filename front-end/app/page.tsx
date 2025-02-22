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
import { loginToSpotify, requestToken } from "@/app/spotify.js";
import "@/app/globals.css";

// TODO: handle regenerating access tokens

const SpotifyAccount = ({ onDataChange, onTokenReceived }) => {
  interface Playlist {
    name: string;
    song_count: number;
    api_endpoint: string;
    tracks: Array<string>;
  };

  const [params, setParams] = useSearchParams();
  const [token, setToken] = useState<string>();

  const [username, setUsername] = useState<string>();
  const [playlists, setPlaylists] = useState<Array<Playlist>>();

  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const fetchToken = async () => {
      let code = params.get("code");

      if (code) {
        const tokenData = await requestToken(code);
        setToken(tokenData.access_token);
        onTokenReceived(tokenData.access_token);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const profileURL = "https://api.spotify.com/v1/me";
      const payload = {headers: {Authorization: `Bearer ${token}`}};

      try {
        const response = await axios.get(profileURL, payload);
        setUsername(response.data.display_name);
      } catch (err) {
        console.error(err);
      }

      const playlistsURL = "https://api.spotify.com/v1/me/playlists";

      try {
        const response = await axios.get(playlistsURL, payload);

        const items = response.data.items;
        let list = [];

        for (let i = 0; i < items.length; i++) {
          list.push({
            name: items[i].name,
            song_count: items[i].tracks.total,
            api_endpoint: items[i].tracks.href,
            tracks: [],
          });
        }

        setPlaylists(list);
      } catch (err) {
        console.log(err);
      }

      setLoaded(true);
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  if (loaded) {
    return (
      <div>
        <p>Signed in as {username}</p>
        <RadioGroup onValueChange={(value) => onDataChange(value)}>
          {playlists.map((item, index) => {
            const option = "playlist" + index;

            return (
              <div key={index}>
                <RadioGroupItem value={item.api_endpoint} id={option} />
                <Label htmlFor={option}>{item.name} ({item.song_count} songs)</Label>
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
              onClick={loginToSpotify}
              className="m-auto text-xl w-5xl p-8">
        <CircleUserRound />
        Sign in to Spotify
      </Button>
    </div>
  );
};

const MainPage = () => {
  const [token, setToken] = useState<string>();

  const [playlist, setPlaylist] = useState<string>();
  const [description, setDescription] = useState<string>();

  const sendExtractRequest = async () => {
    // input validation
    if (!playlist) {
      console.log("playlist cannot be null");
      return;
    }

    if (!description) {
      console.log("description cannot be empty");
      return;
    }

    const payload = {headers: {Authorization: `Bearer ${token}`}};

    try {
      const response = await axios.get(playlist, payload);
      const tracks = [];

      for (let item of response.data.items) {
        tracks.push(item.track.id);
      }

      console.log(tracks);
    } catch (err) {
      console.error(err);
    }

    console.log("submit");
    // send tracks and description to backend api
  };

  return (
    <BrowserRouter>
      <div className="flex flex-col m-auto w-2xl">
        <h1 className="font-black text-2xl text-center">Playlist Curator</h1>
        <SpotifyAccount onDataChange={(data) => setPlaylist(data)}
                        onTokenReceived={(data) => setToken(data)} />

        <p>I want all the songs that are...</p>
        <Input placeholder="happy" name="description"
               onChange={(e) => setDescription(e.target.value)} />

        <Button onClick={sendExtractRequest}>Extract</Button>
      </div>
    </BrowserRouter>
  );
};

export default MainPage;
