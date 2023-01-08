export default class FCRService {
    static deartefactUrl(url: string) {
        if(url.includes("&#58;")) {
            return url.replace("&#58;", ":")
        } else {
            return url
        }
    }

    static async checkForVid167(url: string, host: string) {
        if(url.includes(STATICS.vid167.domain)) {
            const rewrited = await STATICS.vid167.cb(url, host)
            return {ready: true, data: rewrited}
        } else return {ready: false, data: undefined}
    }

    static async rewriteByHostname(frameurl: string) {
        const deartefacted = this.deartefactUrl(frameurl)
        const url_deconstructed = new URL(deartefacted)
        const isVid167 = await this.checkForVid167(deartefacted, url_deconstructed.origin) as any
        if(isVid167.ready) return isVid167.data
        switch(url_deconstructed.host) { 
            // voidboost.net
            case STATICS.voidboost_net.domain:
                return STATICS.voidboost_net.cb(deartefacted, url_deconstructed.hostname)
            // api.loadbox.ws
            case STATICS.api_loadbox_ws.domain: 
                return STATICS.api_loadbox_ws.cb(deartefacted)
            // spinning.allohalive.com
            case STATICS.spinning_allihalive_com.domain: 
                return STATICS.spinning_allihalive_com.cb(deartefacted)
        }
        
    }

    static async rewriteVoidboost(embeedurl: string, url_domain: string) {
        let rewrited = ""
        await fetch(embeedurl, 
            {
                method: "GET", 
                headers: {
                    'Content-Type': 'text/html'
                }
            }
        ).then(function(response) {
            return response.text();
        }).then(async function(data) {
            //Remove prerolls(ads)
            //Rewrite paths to public scripts and other utils
            rewrited = await data.replace("'preroll':",  "'__undefined__':")
                                .replace('/thumbnails/', 'https://voidboost.net/thumbnails/')
                                .replace("'?s='", `'${embeedurl}?s='`)
                                .replace(`_url_params = ''`, `_url_params = ''; parent.postMessage('https://voidboost.net/embed/${embeedurl}?s='+ _season +'&e='+ _episode +'&h='+ cdn.player.getVBR() + _url_params, "*");`)
                                .replace(`window.location.href = '/'+ type +'/'+ t +'/iframe?h='+ cdn.player.getVBR() + a;`, `parent.postMessage(window.location.href = 'https://voidboost.net/'+ type +'/'+ t +'/iframe?h='+ cdn.player.getVBR() + a)`)
        });
        return rewrited
    }

    static async rewriteVid167(embeedurl: string, url: string) {
        let rewrited = ""
        await fetch(embeedurl, {
        }).then(function (response) {
            return response.text();
        }).then(async function (data) {
            //Changed for testing
            rewrited = data.replace("/playerjs/js/playerjs.js?=1012", STATICS.vid167.playerjs_url)
                    //Create link to playerjs script
                    .replace("/player", `${url}/player`)
                    //Remove prerolls(ads)
                    .replace("preroll", "__undefined__")
                    //Remove pause banner
                    .replace('"show": true', '"show": false')

            console.log(rewrited)
        })
        return rewrited
    }

    static async rewriteApiLoadboxWs(embeedurl: string) {
        console.log(STATICS.api_loadbox_ws)
    }

    static async rewriteSpinningAllohaliveCom(embeedurl: string) {
        let rewrited = ""
        const deconstructed = new URL(embeedurl)
        console.log(deconstructed)
        const response = await fetch("/rewrite/allohalive" + deconstructed.pathname + deconstructed.search, {
            method: "POST",
            body: embeedurl
        }).then(res => {
            return res.text()
        }).then(res_txt => {
            rewrited = res_txt.replace("/js/jquery.min.js", `${STATICS.spinning_allihalive_com.url}/js/jquery.min.js`)
                            .replace("/js/baron.js", `${STATICS.spinning_allihalive_com.url}/js/baron.js`)
                            .replace("/js/default-dist.js", `${STATICS.spinning_allihalive_com.url}/js/default-dist.js`)
                            .replace("/js/playerjs-alloha-new.js", STATICS.spinning_allihalive_com.playerjs_url)
                            .replace("/style/style.css", `${STATICS.spinning_allihalive_com.url}/style/style.css`)
            //<script src=&quot;/js/jquery.min.js?v=3.6.0&quot;></script>}
            //<script src=&quot;/js/baron.js?v=1.931&quot;></script>
            //<script src=&quot;/js/default-dist.js?v=4.16&quot;></script>
            //<script src=&quot;/js/playerjs-alloha-new.js?v=16.14.2&quot;></script>
        })
        return rewrited
    }
}

export const STATICS = {
    voidboost_net: {
        domain: 'voidboost.net',
        url: 'https://voidboost.net',
        url_slashed: 'https://voidboost.net/',
        cb: FCRService.rewriteVoidboost 
    }, 
    api_loadbox_ws: {
        domain: 'api.loadbox.ws',
        url: 'https://api.loadbox.ws',
        url_slashed: 'https://api.loadbox.ws/',
        cb: FCRService.rewriteApiLoadboxWs
    },
    spinning_allihalive_com: {
        domain: 'spinning.allohalive.com',
        url: 'https://spinning.allohalive.com',
        url_slashed: 'https://spinning.allohalive.com/',
        playerjs_url: '/static/pjs/js/alloha/playerjs-alloha-new.js',
        cb: FCRService.rewriteSpinningAllohaliveCom
    },
    vid167: {
        domain: 'vid167',
        url: 'https://vid1672084730.vb17121coramclean.pw',
        url_slashed: "https://vid1672084730.vb17121coramclean.pw/",
        playerjs_url: '/static/pjs/js/vid167/playerjs.js',
        cb: FCRService.rewriteVid167
    },
}