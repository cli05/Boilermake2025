"use client"

import { useEffect, useState } from "react";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import axios from "axios";

import { loginToSpotify, requestToken } from "@/app/spotify.js";

const SpotifyAccount = () => {
	const [params, setParams] = useSearchParams();
  const [token, setToken] = useState("");
	
	const [username, setUsername] = useState("");
  const [playlists, setPlaylists] = useState([]);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
			let code = params.get("code");

			if (code) {
				const tokenData = await requestToken(code);
				setToken(tokenData.access_token);
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
					list.push({"name": items[i].name, "size": items[i].tracks.total});
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
				{playlists.map((item, index) => (
				  <p key={index}>{item.name} ({item.size} songs)</p>
				))}
			</div>
		);
  }

  return (
		<button onClick={loginToSpotify}>Sign in to Spotify</button>
  );
};

const MainPage = () => {
  return (
    <BrowserRouter>
      <h1>Playlist Curator</h1>
      <SpotifyAccount />
    </BrowserRouter>
  );
};

export default MainPage;
