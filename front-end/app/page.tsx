"use client"

// react and nextjs imports
import { useEffect, useState } from "react"
import { BrowserRouter, useSearchParams } from "react-router-dom"
import axios from "axios"

// shadcn/ui imports
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

// cool background import
const { Shift } = require("ambient-cbg")

import { X } from "lucide-react";

// react spotify icon imports
import { FaSpotify } from "react-icons/fa";


// user-defined imports
import { getSpotifyAuthLink, requestToken } from "@/app/spotify.js"
import "@/app/globals.css"

const PROFILE_URL = "https://api.spotify.com/v1/me"
const GET_PLAYLISTS_URL = "https://api.spotify.com/v1/me/playlists"
const GET_TRACKS_URL = "https://api.spotify.com/v1/tracks"
const CREATE_PLAYLIST_URL = "https://api.spotify.com/v1/users/{user_id}/playlists"
const ADD_TO_PLAYLIST_URL = "https://api.spotify.com/v1/playlists/{playlist_id}/tracks"

const MAX_DESC_LEN = 50

const Heading = () => {
  return (
    <div className="text-center mb-8">
      <h1 className="font-black text-4xl text-green-500 mb-2">Playlist Curator</h1>
      <p className="text-gray-300">Curate your perfect playlist with ease.</p>
    </div>
  )
} /* Heading() */

const SpotifyAccount = ({ onLoginAttempt, onValueChange, token }) => {
  interface Playlist {
    name: string
    song_count: number
    api_endpoint: string
    tracks: Array<string>
  }

  const [username, setUsername] = useState<string>()
  const [playlists, setPlaylists] = useState<Array<Playlist>>()

  const [showPlaylists, setShowPlaylists] = useState<boolean>(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const payload = { headers: { Authorization: `Bearer ${token}` } }

      try {
        const profileResponse = await axios.get(PROFILE_URL, payload)
        setUsername(profileResponse.data.display_name)

        const playlistsResponse = await axios.get(GET_PLAYLISTS_URL, payload)
        const list = []

        for (const item of playlistsResponse.data.items) {
          list.push({
            name: item.name,
            song_count: item.tracks.total,
            api_endpoint: item.tracks.href,
            tracks: [],
          })
        }

        setPlaylists(list)
        setShowPlaylists(true)
      } catch (err) {
        console.error(err)
      }
    }

    if (token && !username) {
      fetchProfile()
    }
  }, [token, username])

  if (showPlaylists) {
    return (
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <p className="text-green-500 mb-4">Signed in as {username}</p>
        <ScrollArea className="h-60 w-full">
          <RadioGroup onValueChange={(value) => onValueChange(playlists[value])} className="space-y-2">
            {playlists.map((item, index) => {
              const optionId = "playlist" + index

              return (
                <div key={index} className="flex items-center space-x-2 text-white">
                  <RadioGroupItem value={index} id={optionId} className="border-white text-white" />
                  <Label htmlFor={optionId} className="cursor-pointer">

                    {item.name} <span className="text-gray-400">({item.song_count} songs) </span>

                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </ScrollArea>
      </div>
    )
  }

  return (
      <div className="flex justify-center">
        <Button
            variant="outline"
            onClick={onLoginAttempt}
            className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 rounded-full flex items-center space-x-2 transition duration-300"
        >
          <FaSpotify style={{fontSize: "100px"}}/>
          <span>Sign in to Spotify</span>
        </Button>
      </div>
  )
} /* SpotifyAccount() */


const InputForm = ({ onLoginAttempt, onSubmit, token }) => {
  const [playlistName, setPlaylistName] = useState<string>()
  const [playlistAPI, setPlaylistAPI] = useState<string>()
  const [description, setDescription] = useState<string>()


  const updatePlaylist = (value) => {
    setPlaylistName(value.name)
    setPlaylistAPI(value.api_endpoint)
  }

  const updateDescription = (event) => {
    setDescription(event.target.value)
  }

  const extractButtonHandler = (event) => {
    if (!playlistName || !description) {
      console.log("All fields are required")
      return
    }

    if (description.length > MAX_DESC_LEN) {
      console.log("Description is too long")
      return
    }

    const data = {
      playlistName: playlistName,
      playlistAPI: playlistAPI,
      description: description,
    }

    onSubmit(data)
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <SpotifyAccount onLoginAttempt={onLoginAttempt} onValueChange={updatePlaylist} token={token} />

      <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <Label htmlFor="description" className="text-green-500 mb-2 block">
          I want all the songs that are...
        </Label>
        <Input
          id="description"
          name="description"
          placeholder="happy"
          onChange={(e) => setDescription(e.target.value)}
          className="bg-gray-800 text-white border-gray-700 focus:border-green-500 mb-4"
        />

        <Button
          onClick={extractButtonHandler}
          className="bg-green-500 hover:bg-green-400 text-black font-bold py-2 px-4 rounded-full transition duration-300"
        >
          Extract
        </Button>
      </div>
    </div>
  )
} /* InputForm() */

const Editor = ({ onSubmit, onCancel, tracks }) => {
  const [playlistName, setPlaylistName] = useState<string>("My Playlist")
  const [trackList, setTrackList] = useState<Array<string>>()

  useEffect(() => {
    setTrackList(tracks)
  }, [tracks])

  const removeTrack = (trackId) => {
    setTrackList(trackList.filter((item) => item.track_id !== trackId))
  }

  const createButtonHandler = (event) => {
    if (!playlistName) {
      console.log("Playlist name cannot be empty.")
      return
    }

    const trackURIs = []

    for (const track of trackList) {
      trackURIs.push(`spotify:track:${track.track_id}`)
    }

    const data = {
      name: playlistName,
      trackURIs: trackURIs,
    }
    console.log(data)

    onSubmit(data)
  }

  if (!trackList) {
    return <div>Loading...</div>
  }

  if (trackList.length == 0) {
    return <div>No tracks selected.</div>
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <Label htmlFor="playlist-name" className="text-green-500 mb-2 block">
          Name your playlist:
        </Label>
        <Input
          id="playlist-name"
          name="playlist-name"
          defaultValue="My Playlist"
          onChange={(e) => setPlaylistName(e.target.value)}
          className="bg-gray-800 text-white border-gray-700 focus:border-green-500 mb-4"
        />

        <ScrollArea className="h-[400px] w-full border border-gray-700 rounded-md p-4 mb-4">
          {trackList.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 mb-4">
              <Button
                onClick={() => removeTrack(item.track_id)}
                variant="destructive"
                size="icon"
                className="shrink-0 bg-red-500 hover:bg-red-600"
              >
                <X className="h-4 w-4 text-black" />
              </Button>
              <div>
                <p className="font-bold text-green-500">{item.title}</p>
                <p className="text-sm text-gray-400">
                  <i>{item.artist}</i> | {item.album}
                </p>
              </div>
            </div>
          ))}
        </ScrollArea>

        <div className="flex space-x-4">
          <Button onClick={createButtonHandler} className="bg-green-500 hover:bg-green-400 text-black">
            Create Playlist
          </Button>
          <Button onClick={onCancel} variant="destructive" className="bg-red-500 hover:bg-red-600 text-black">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

const Program = () => {
  interface Song {
    track_id: string
    title: string
    artist: string
    album: string
  }

  const [params, setParams] = useSearchParams()

  const [accessToken, setAccessToken] = useState<string>()
  const [refreshToken, setRefreshToken] = useState<string>()

  const [userId, setUserId] = useState<string>()

  const [playlistName, setPlaylistName] = useState<string>()
  const [description, setDescription] = useState<string>()

  const [rawSongs, setRawSongs] = useState<Array<string>>()
  const [cookedSongs, setCookedSongs] = useState<Array<Song>>()

  const [showEditor, setShowEditor] = useState<boolean>(false)

  useEffect(() => {
    const fetchToken = async () => {
      const code = params.get("code")

      if (code) {
        const data = await requestToken(code)
        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)
      }
    }

    fetchToken()
  }, [params])

  useEffect(() => {
    const getSongData = async () => {
      if (!rawSongs) {
        return
      }

      const allTrackIds = rawSongs.join()

      const payload = {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { ids: allTrackIds },
      }

      try {
        const response = await axios.get(GET_TRACKS_URL, payload)
        const tracks = []

        for (const item of response.data.tracks) {
          const artists = []

          for (const artist of item.artists) {
            artists.push(artist.name)
          }

          tracks.push({
            track_id: item.id,
            title: item.name,
            artist: artists.join(", "),
            album: item.album.name,
          })
        }

        setCookedSongs(tracks)
        setShowEditor(true)
      } catch (err) {
        console.error(err)
      }
    }

    getSongData()
  }, [rawSongs, accessToken])

  useEffect(() => {
    const fetchUserId = async () => {
      const payload = { headers: { Authorization: `Bearer ${accessToken}` } }

      try {
        const response = await axios.get(PROFILE_URL, payload)
        setUserId(response.data.id)
      } catch (err) {
        console.error(err)
      }
    }

    if (accessToken && !userId) {
      fetchUserId()
    }
  }, [accessToken, userId])

  const loginHandler = async () => {
    window.location.href = await getSpotifyAuthLink()
  }

  const showInputForm = () => {
    setShowEditor(false)
  }

  const sendExtractRequest = async (data) => {
    setPlaylistName(data.playlistName)
    setDescription(data.description)

    const payload = { headers: { Authorization: `Bearer ${accessToken}` } }
    const tracks = []

    try {
      const response = await axios.get(data.playlistAPI, payload)

      for (const item of response.data.items) {
        tracks.push(item.track.id)
      }
    } catch (err) {
      console.error(err)
    }

    const classifyData = {
      text: data.description,
      song_list: tracks,
    };

    try {
      const response = await axios.post("http://localhost:8000/api/classify/", classifyData);
      if (!response.data.tracks) {
        alert("No matches were found. Modify your description and try again.");
      }

      setRawSongs(response.data.tracks)
    } catch (err) {
      console.error(err);
    }
  }

  const sendCreateRequest = async (data) => {
    const headers = { headers: { Authorization: `Bearer ${accessToken}` } }

    const createPlaylistURL = CREATE_PLAYLIST_URL.replace("{user_id}", userId)
    const createData = {
      name: data.name,
      description: `Collection of songs in ${playlistName} that are ${description}, carefully chosen by Playlist Curator.`,
    }

    try {
      const createResponse = await axios.post(createPlaylistURL, createData, headers)

      let newPlaylistId = ""
      let newPlaylistLink = ""

      if (createResponse.status == 201) {
        const playlistResponse = await axios.get(createResponse.data.href, headers)

        newPlaylistId = playlistResponse.data.id
        newPlaylistLink = playlistResponse.data.external_urls.spotify
      }

      const addToPlaylistURL = ADD_TO_PLAYLIST_URL.replace("{playlist_id}", newPlaylistId)
      const addToData = {
        uris: data.trackURIs,
      }

      const addResponse = await axios.post(addToPlaylistURL, addToData, headers)

      if (addResponse.status == 201) {
        alert("Playlist was successfully saved!")
        window.location.href = newPlaylistLink
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className={`min-h-screen bg-[#1d0f2b] text-white p-8 ${!accessToken ? "flex items-center justify-center" : ""}`}>
      {accessToken ? (
        <div>
          <Heading />
          
          { !showEditor && <InputForm onLoginAttempt={loginHandler}
                                      onSubmit={sendExtractRequest}
                                      token={accessToken} /> }

            { showEditor && <Editor onSubmit={sendCreateRequest}
                                  onCancel={showInputForm}
                                  tracks={cookedSongs} /> }
          </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="bg-black p-12 rounded-lg shadow-xl max-w-lg w-full text-center">
            <Heading />
            <SpotifyAccount onLoginAttempt={loginHandler} onValueChange={() => {}} token={null} />
          </div>
        </div>
      )}
    </div>
  )
} /* Program() Program File  */

const MainPage = () => {
  return (
    <div className="bg-black min-h-screen">
      <BrowserRouter>
        <Program />
      </BrowserRouter>
    </div>
  )
} /* MainPage() */

export default MainPage
