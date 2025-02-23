"use client"

// react and nextjs imports
import { useEffect, useState } from "react";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import axios from "axios";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

// lucide-react icon miports
import { CircleUserRound } from "lucide-react";

// user-defined imports
import { getSpotifyAuthLink, requestToken } from "@/app/spotify.js";
import "@/app/globals.css";

const PROFILE_URL = "https://api.spotify.com/v1/me";
const GET_PLAYLISTS_URL = "https://api.spotify.com/v1/me/playlists";
const GET_TRACKS_URL = "https://api.spotify.com/v1/tracks";
const CREATE_PLAYLIST_URL = "https://api.spotify.com/v1/users/{user_id}/playlists";
const ADD_TO_PLAYLIST_URL = "https://api.spotify.com/v1/playlists/{playlist_id}/tracks";

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

    if (token && !username) {
      fetchProfile();
    }
  }, [token, username]);

  if (showPlaylists) {
    return (
      <div>
        <p>Signed in as {username}</p>
        <RadioGroup onValueChange={(value) => onValueChange(playlists[value])}>
          {playlists.map((item, index) => {
            const optionId = "playlist" + index;

            return (
              <div key={index}>
                <RadioGroupItem value={index} id={optionId} />
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
  const [playlistName, setPlaylistName] = useState<string>();
  const [playlistAPI, setPlaylistAPI] = useState<string>();
  const [description, setDescription] = useState<string>();

  const updatePlaylist = (value) => {
    setPlaylistName(value.name);
    setPlaylistAPI(value.api_endpoint);
  };

  const updateDescription = (event) => {
    setDescription(event.target.value);
  };

  const extractButtonHandler = (event) => {
    if (!playlistName || !description) {
      console.log("All fields are required");
      return;
    }

    if (description.length > MAX_DESC_LEN) {
      console.log("Description is too long");
      return;
    }

    const data = {
      playlistName: playlistName,
      playlistAPI: playlistAPI,
      description: description,
    };

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

const Editor = ({ onSubmit, onCancel, tracks }) => {
  const [playlistName, setPlaylistName] = useState<string>("My Playlist");
  const [trackList, setTrackList] = useState<Array<string>>();

  useEffect(() => {
    setTrackList(tracks);
  }, [tracks]);

  const removeTrack = (trackId) => {
    setTrackList(trackList.filter((item) => item.track_id !== trackId));
  };

  const createButtonHandler = (event) => {
    if (!playlistName) {
      console.log("Playlist name cannot be empty.");
      return;
    }

    const trackURIs = [];

    for (let track of trackList) {
      trackURIs.push(`spotify:track:${track.track_id}`);
    }

    const data = {
      name: playlistName,
      trackURIs: trackURIs,
    };
    console.log(data);

    onSubmit(data);
  };

  if (!trackList) {
    return <div>Loading...</div>;
  }

  if (trackList.length == 0) {
    // do stuff
  }

  return (
    <div>
      {trackList.map((item, index) => (
        <div key={index}>
          <div>
            <p>{item.title}</p>
            <p>{item.artist} | {item.album}</p>
          </div>
          <Button onClick={(event) => removeTrack(item.track_id)}>Remove</Button>
        </div>
      ))}

      <Label htmlFor="playlist-name">Name your playlist:</Label>
      <Input id="playlist-name"
             name="playlist-name"
             defaultValue="My Playlist" 
             onChange={(e) => setPlaylistName(e.target.value)} />
      <Button onClick={createButtonHandler}>Create Playlist</Button>
      <Button onClick={onCancel}>Cancel</Button>
    </div>
  );
}; /* Editor() */

const Program = () => {
  interface Song {
    track_id: string;
    title: string;
    artist: string;
    album: string;
  };

  const [params, setParams] = useSearchParams();
  
  const [accessToken, setAccessToken] = useState<string>();
  const [refreshToken, setRefreshToken] = useState<string>();

  const [userId, setUserId] = useState<string>();

  const [playlistName, setPlaylistName] = useState<string>();
  const [description, setDescription] = useState<string>();

  const [rawSongs, setRawSongs] = useState<Array<string>>();
  const [cookedSongs, setCookedSongs] = useState<Array<Song>>();

  const [showEditor, setShowEditor] = useState<boolean>(false);

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

  useEffect(() => {
    const getSongData = async () => {
      if (!rawSongs) {
        return;
      }

      const allTrackIds = rawSongs.join();

      const payload = {
        headers: {Authorization: `Bearer ${accessToken}`},
        params: {ids: allTrackIds},
      };

      try {
        const response = await axios.get(GET_TRACKS_URL, payload);
        const tracks = [];

        for (let item of response.data.tracks) {
          const artists = [];

          for (let artist of item.artists) {
            artists.push(artist.name);
          }

          tracks.push({
            track_id: item.id,
            title: item.name,
            artist: artists.join(", "),
            album: item.album.name,
          });
        }

        setCookedSongs(tracks);
        setShowEditor(true);
      } catch (err) {
        console.error(err);
      }
    };

    getSongData();
  }, [rawSongs]);

  useEffect(() => {
    const fetchUserId = async () => {
      const payload = {headers: {Authorization: `Bearer ${accessToken}`}};

      try {
        const response = await axios.get(PROFILE_URL, payload);
        setUserId(response.data.id);
      } catch (err) {
        console.error(err);
      }
    };

    if (accessToken && !userId) {
      fetchUserId();
    }
  }, [accessToken, userId]);

  const loginHandler = async () => {
    window.location.href = await getSpotifyAuthLink();
  };

  const showInputForm = () => {
    setShowEditor(false);
  };

  const sendExtractRequest = async (data) => {
    setPlaylistName(data.playlistName);
    setDescription(data.description);

    const payload = {headers: {Authorization: `Bearer ${accessToken}`}};
    const tracks = [];

    try {
      const response = await axios.get(data.playlistAPI, payload);

      for (let item of response.data.items) {
        tracks.push(item.track.id);
      }
    } catch (err) {
      console.error(err);
    }

    console.log("submit");
    
    // api call to back end

    setRawSongs(tracks);
  };

  const sendCreateRequest = async (data) => {
    const headers = {headers: {Authorization: `Bearer ${accessToken}`}};

    const createPlaylistURL = CREATE_PLAYLIST_URL.replace("{user_id}", userId);
    const createData = {
      name: data.name,
      description: `Collection of songs in ${playlistName} that are ${description}, carefully chosen by Playlist Curator.`,
    };

    try {
      const createResponse = await axios.post(createPlaylistURL, createData, headers);
      
      let newPlaylistId = "";
      let newPlaylistLink = "";
      
      if (createResponse.status == 201) {
        const playlistResponse = await axios.get(createResponse.data.href, headers);

        newPlaylistId = playlistResponse.data.id;
        newPlaylistLink = playlistResponse.data.external_urls.spotify;
      }
      
      const addToPlaylistURL = ADD_TO_PLAYLIST_URL.replace("{playlist_id}", newPlaylistId);
      const addToData = {
        uris: data.trackURIs,
      };

      const addResponse = await axios.post(addToPlaylistURL, addToData, headers);

      if (addResponse.status == 201) {
        alert("Playlist was successfully saved!");
        window.location.href = newPlaylistLink;
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <Heading />

      { !showEditor && <InputForm onLoginAttempt={loginHandler}
                                  onSubmit={sendExtractRequest}
                                  token={accessToken} /> }

      { showEditor && <Editor onSubmit={sendCreateRequest}
                              onCancel={showInputForm}
                              tracks={cookedSongs} /> }
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
