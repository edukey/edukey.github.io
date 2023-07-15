//-- Personal Firestore SDK using directly the REST API, simplistic and limited but supports GetIds (select returned fields)

const FS={
	cfg:null,
	root:null,
	url:null
}

/*
	console.log(await fsGetAll('snippets'))
	console.log(await fsGetIds('snippets'))
	console.log(await fsGetDoc('snippets','if-else'))
	await fsCreateDoc('snippets','test-1',{hello:'world'})
	await fsUpdateDoc('snippets','test-1',{str:'world',num:123,bol:false,nul:null,lst:["a",1,true]})
	console.log(await fsGetDoc('snippets','test-1'))
	console.log(await fsGetDoc('snippets','if-else'))
	console.log(await fsDeleteDoc('snippets','test-1'))
*/

//-- Firestore configuration using native Google config object

function fsInitDefaultConfig() {
	// see remote_access.txt file
	const bcfg= 'eyJhcGlLZXkiOiJBSXphU3lDNVViSk9FOV9ROUJWR3VNS1NzLUV0OVhXVnhoMi1T'+
				'UjAiLCJhdXRoRG9tYWluIjoiZWR1LWtleS5maXJlYmFzZWFwcC5jb20iLCJwcm9q'+
				'ZWN0SWQiOiJlZHUta2V5Iiwic3RvcmFnZUJ1Y2tldCI6ImVkdS1rZXkuYXBwc3Bv'+
				'dC5jb20iLCJtZXNzYWdpbmdTZW5kZXJJZCI6IjIwMDc4MTk4MTk2NSIsImFwcElk'+
				'IjoiMToyMDA3ODE5ODE5NjU6d2ViOmZlYWZjNjc2NzliZmY4NTc2MjY4NDQiLCJt'+
				'ZWFzdXJlbWVudElkIjoiRy1XRjdLOVpYTVYxIn0='
	fsInitConfig(bcfg)
}

function fsInitConfig(bcfg) {
	FS.cfg = JSON.parse(atob(bcfg))
	FS.root = 'projects/'+FS.cfg.projectId+'/databases/(default)'
	FS.url = 'https://firestore.googleapis.com/v1/'+FS.root+'/documents'
}

//-- Firestore operations using REST API

// https://firebase.google.com/docs/firestore/reference/rest?hl=en&authuser=0

/** 
* @param id if null : auto generate id
*/
async function fsCreateDoc(collection, id, fields) {
	// https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/createDocument?authuser=0&hl=fr
	let path='/'+collection
	if(id) path=path+'?documentId='+id // explicitely sets an id, else auto-gen
	const doc=await apiPost(path, {fields:fsBuildDoc(fields)})
	if(!doc) return null
	console.log(doc)
	return fsParseDoc(doc)
}

async function fsUpdateDoc(collection, id, fields) {
	// https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/patch?authuser=0&hl=fr
	// query param : 
	// updateMask to update only some fields
	// mask to return only some fields
	// currentDocument some pre-conditions
	const doc=await apiPatch('/'+collection+'/'+id, {fields:fsBuildDoc(fields)})
	if(!doc) return null
	console.log(doc)
	return fsParseDoc(doc)
}

async function fsDeleteDoc(collection, id) {
	const r=await apiDelete('/'+collection+'/'+id) // returns empty object
	console.log(r)
	return r
}

async function fsGetDoc(collection, id) {
	const doc=await apiGet('/'+collection+'/'+id)
	if(!doc) return null
	console.log(doc)
	return fsParseDoc(doc)
}

/** return FS Value Object from Js value */
function fsBuildValue(v) {
	if(v==null) return {nullValue:null}
	const tp=typeof(v)
	if(tp=='undefined') return {nullValue:null}
	if(tp=='string') return {stringValue:v}
	if(tp=='boolean') return {booleanValue:v}
	if(tp=='number') {
		if(Number.isInteger(v))	return {integerValue:v.toString()}
		return {doubleValue:v}
	}
	if(tp=='object') {
		if(v.constructor==Array) {
			const ls=[]
			for(const it of v) {
				ls.push(fsBuildValue(it))
			}
			return {arrayValue:{values:ls}}
		}
		if(v.constructor==Date) throw "FS serializer: Date/timestamp value type not implemented"
		if(v.constructor==Object) throw "FS serializer: Sub-Object value type not implemented"
		throw "FS serializer: Unknown constructor for value type: "+v.constructor
		//if(v.constructor==Date) return {timestampValue:v.toString()}
		//if(v.constructor==Object) 
	}
	throw "FS serializer: Unmanaged typeof for value type: "+tp
}

/** Generate FS doc format from plain Js obj */
function fsBuildDoc(obj) {
	const doc={}
	for(const f in obj) {
		doc[f]=fsBuildValue(obj[f])
	}
	return doc
}

function fsParseValue(fsv) {
	if('nullValue' in fsv) return null
	if('stringValue' in fsv) return fsv.stringValue
	if('integerValue' in fsv) return parseInt(fsv.integerValue) // integerValue set as string ?
	if('doubleValue' in fsv) return fsv.doubleValue // doubleValue is a direct number
	if('booleanValue' in fsv) return fsv.booleanValue
	if('timestampValue' in fsv) throw "FS parser: unimplemented timestampValue" // return fsv.stringValue
	if('arrayValue' in fsv) {
		const ls=[]
		for(const it of fsv.arrayValue.values) {
			ls.push(fsParseValue(it))
		}
		return ls
	}
	throw "FS parser: unimplemented	FS type: "+JSON.stringify(fsv)
}

/** converts FS doc format to Js object with meta data @returns _id,_prj,_coll,_cre,_upd,_name,fields... */
function fsParseDoc(doc) {
	// "name": "projects/edu-key/databases/(default)/documents/snippets/if-else",
	const p=doc.name.split('/')
	const obj={}
	obj._id=p[p.length-1]
	obj._prj=p[1]
	obj._db=p[3]
	obj._coll=p[p.length-2]
	obj._cre=doc.createTime
	obj._upd=doc.updateTime
	obj._name=doc.name
	for(const f in doc.fields) {
		obj[f]=fsParseValue(doc.fields[f])
	}
	return obj
}

/** get all docs in collection with full content
 * @returns []{_id,_cre,_upd,_prj,_coll,fields...}
*/
async function fsGetAll(collection) {
	const r=await apiGet('/'+collection) // get all snippets
	if(!r) return null
	// r: documents[]{name,createTime,updateTime,fields:{}}
	const ls=[]
	for(const doc of r.documents) {
		ls.push(fsParseDoc(doc))
	}
	return ls
}

/** get all ids in collection 
 * @returns []{id,coll,cre,upd}
*/
async function fsGetIds(collection) {
	const qry={
		parent:FS.root,
		structuredQuery:{
			from:[{collectionId:collection}],
			select:{fields:[{fieldPath:'__name__'}]}
		}
	}
	const rs=await apiPost(':runQuery',qry)
	//console.log(r) // []{document:{name,createTime,updateTime},readTime:''}
	if(!rs) return null
	const ls=[]
	for(const r of rs) {
		const doc=r.document
		const p=doc.name.split('/')
		ls.push({id:p[p.length-1],coll:collection,cre:doc.createTime,upd:doc.updateTime})
	}
	return ls
}


//-- Generic Google API request uing FS.url and FS.cfg.apiKey
//---------------------------------------------

async function apiGet(path){
	return await apiReq('GET', path)
}
async function apiDelete(path){
	return await apiReq('DELETE', path)
}
async function apiPost(path, body_obj){
	return await apiReq('POST', path, body_obj)
}
async function apiPatch(path, body_obj){
	return await apiReq('PATCH', path, body_obj)
}
async function apiReq(method, path, body_obj) {
	const headers = new Headers()
	if(body_obj) headers.append("Content-Type", "application/json")
	const url=FS.url+path+(path.indexOf('?')>0?'&':'?')+'key='+FS.cfg.apiKey
	const body_str=body_obj?JSON.stringify(body_obj):null
	const resp = await window.fetch(url, {method:method, body:body_str, headers:headers})
	console.log(resp.status, method, url, 'input:', body_str?body_str.length:0)
	if(resp.status==200) {
		return await resp.json()
	}
	else {
		console.log(resp)
		return null
	}
}
