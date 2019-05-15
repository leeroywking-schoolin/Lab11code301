applicationCache.get(url)
.then(result => {
    if(!result.body.items){throw 'NO DATA';}
    else{
        result.body.items 
    }
})