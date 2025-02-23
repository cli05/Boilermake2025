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
const { Shift } = require('ambient-cbg')

// lucide-react icon imports
import { CircleUserRound } from "lucide-react"

// user-defined imports
import { getSpotifyAuthLink, requestToken } from "@/app/spotify.js"
import "@/app/globals.css"

const PROFILE_URL = "https://api.spotify.com/v1/me"
const GET_PLAYLISTS_URL = "https://api.spotify.com/v1/me/playlists"

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

    if (token) {
      fetchProfile()
    }
  }, [token])

  if (showPlaylists) {
    return (
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <p className="text-green-500 mb-4">
          Signed in as <span className="font-bold">{username}</span>
        </p>
        <ScrollArea className="h-60 w-full">
          <RadioGroup onValueChange={(value) => onValueChange(value)} className="space-y-2">
            {playlists.map((item, index) => {
              const optionId = "playlist" + index

              return (
                <div key={index} className="flex items-center space-x-2 text-white">
                  <RadioGroupItem value={item.api_endpoint} id={optionId} className="border-white text-white" />
                  <Label htmlFor={optionId} className="cursor-pointer">
                    {item.name} <span className="text-gray-400">({item.song_count} songs)</span>
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
        <CircleUserRound />
        <span>Sign in to Spotify</span>
      </Button>
    </div>
  )
} /* SpotifyAccount() */

const InputForm = ({ onLoginAttempt, onSubmit, token }) => {
  const [playlist, setPlaylist] = useState<string>()
  const [description, setDescription] = useState<string>()

  const updatePlaylist = (value) => {
    setPlaylist(value)
  }

  const updateDescription = (event) => {
    setDescription(event.target.value)
  }

  const extractButtonHandler = (event) => {
    if (!playlist || !description) {
      console.log("All fields are required")
      return
    }

    if (description.length > MAX_DESC_LEN) {
      console.log("Description is too long")
      return
    }

    const data = { playlist, description }
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

const Editor = () => {
  return <div>what</div>
} /* Editor() */

const Program = () => {
  const [params, setParams] = useSearchParams()

  const [accessToken, setAccessToken] = useState<string>()
  const [refreshToken, setRefreshToken] = useState<string>()

  const [showEditor, setShowEditor] = useState<boolean>(false)

  const loginHandler = async () => {
    window.location.href = await getSpotifyAuthLink()
  }

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

  const sendExtractRequest = async (data) => {
    const payload = { headers: { Authorization: `Bearer ${accessToken}` } }

    try {
      const response = await axios.get(data.playlist, payload)
      const tracks = []

      for (const item of response.data.items) {
        tracks.push(item.track.id)
      }
    } catch (err) {
      console.error(err)
    }

    console.log("submit")
  }

  return (
    <div className={`min-h-screen bg-black text-white p-8 ${!accessToken ? "flex items-center justify-center" : ""}`}>
      {/* Background Effect */}
      <Shift />
      {accessToken ? (
        <>
          <Heading />
          {!showEditor && <InputForm onLoginAttempt={loginHandler} onSubmit={sendExtractRequest} token={accessToken} />}
          {showEditor && <Editor />}
        </>
      ) : (
        <div className="text-center">
          <Heading />
          <SpotifyAccount onLoginAttempt={loginHandler} onValueChange={() => {}} token={null} />
        </div>
      )}
    </div>
  )
} /* Program() */

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