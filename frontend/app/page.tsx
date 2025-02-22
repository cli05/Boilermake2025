import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

import { loginToSpotify, requestToken } from "./spotify";

const MainPage = () => {
  const [token, setToken] = useState("");
	const [profile, setProfile] = useState();

  useEffect(() => {
    const [params, setParams] = useSearchParams();

    let code = params.get("code");

    if (code) {
      const tokenData = requestToken(code);
      setToken(tokenData.access_token);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
		  const profileURL = "https://api.spotify.com/v1/me";
		  const payload = {headers: {Authorization: `Bearer ${token}`}};

			try {
				const response = await axios.get(profileURL, payload);
				setProfile(response.data);
			} catch (err) {
				console.error(err);
			}
    };

		fetchProfile();
  }, [token]);

  useEffect(() => {

  }, [profile]);

  return (
    <h1>Playlist Curator</h1>
    <button onclick={() => await loginToSpotify()}>Sign in to Spotify</button>
  );
};

export default MainPage;
