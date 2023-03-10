import { observer } from 'mobx-react-lite'
import {FC, useEffect, useState} from 'react'
import { IFilm } from "../../../../models/IFilm"
import cl from "./film.module.sass"
import {useNavigate} from "react-router-dom"
import { useTranslation } from '../../../../hooks/translator.hook'
import AllowAuth from '../../../AllowAuth'
import UserService from '../../../../services/UserService'

const FilmComponent: FC<IFilm> = (props: IFilm) => {
 
    const navigate = useNavigate()
    const [isInWatchLater, setIsInWL] = useState<boolean | null>(null)
    const [isWLLoading, setIsWLLoading] = useState<boolean>(false)

    const {translate} = useTranslation()

    const isObject = (obj: any) => {
        return Object.prototype.toString.call(obj) === '[object Object]'
    }

    const changeWatchLater = async () => {
        if(isInWatchLater == null) return  
        try {
            if(isInWatchLater == true) {
                setIsWLLoading(true)
                await UserService.removeWLFilm(props.id)
                setIsInWL(false)
            } else {
                setIsWLLoading(true)
                await UserService.addWLFilm(props.id)
                setIsInWL(true)    
            }
        } catch(e) {
            console.log(e) 
        } finally {
            setIsWLLoading(false)
        }
    }

    useEffect(() => {
        console.log(props)
        var inFlag = false 
        if(props && props.watchLater !== undefined) {
            for(var i=0;i < props.watchLater.length;i++) {
                console.log(props.watchLater[i])
                if(isObject(props.watchLater[i])) {
                    if(props.watchLater[i].id == String(props.id)) {
                        setIsInWL(true)
                        inFlag = true
                        console.log(props.watchLater[i].id + " " + String(props.id))
                    }
                }
            }
            if(inFlag == false) return setIsInWL(false)
        }
    }, [])
    
    
    return (
        <div className={cl.Film_container}> 
            <div className={cl.Content_container}>
                <div 
                    className={cl.Picture}
                >
                    <img src={props.poster} className={cl.Img} referrerPolicy={"no-referrer"}/>
                    <div className={cl.Blurer} onClick={() => navigate(`/film/${props.id}`)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="44" viewBox="0 0 16 16">
                            <linearGradient id="gradient">
                                <stop className="main-stop" offset="0%" />
                                <stop className="alt-stop" offset="100%" />
                            </linearGradient>
                            <path fill="url(#gradient)" d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                        </svg>
                    </div>
                </div>
                <div className={cl.Content}>
                    <p className={cl.Name}> {props.name} </p>
                    <div className={cl.Description}> 
                        {props.year}. {props.genres.map((genre, index) => {
                                if(index + 1 === props.genres.length) {
                                    return <span key={genre}> {genre} </span>
                                } else {
                                    return <span key={genre}> {genre}, </span>
                                }
                            }
                        )}
                    </div>
                </div>
            </div>
            <div className={cl.Opts}>
                <button className={cl.NT_btn} onClick={() => {
                    window.open(`/film/${props.id}`, '_blank')?.focus()
                }}> {translate("home.actions.new_tab")} </button>
                <AllowAuth>
                    {
                        !isInWatchLater &&
                            <button className={cl.NT_btn} onClick={() => {
                                changeWatchLater()
                            }}> watch later </button>
                    }
                </AllowAuth>
            </div>
        </div>
    )
}

export default observer(FilmComponent)
