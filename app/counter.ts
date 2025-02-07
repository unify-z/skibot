import { Database } from "./JsonDBHelper.js";

class Counter{
    public _db: Database;
    constructor(_db: Database){
        this._db = _db;
    }
    async add_group(group_id: number){
        const get_grouplist = this._db.get('groupList')

        if (!get_grouplist.includes(group_id)){
            get_grouplist.push(group_id)
            this._db.updateOne('groupList',get_grouplist)
            return
        }
        return
    }
    async add_user(user_id: number){
        const get_userlist = this._db.get('userList')
        if (!get_userlist.includes(user_id)){
            get_userlist.push(user_id)
            this._db.updateOne('userList',get_userlist)
            return
        }
        return

    }
    async add_hits(){
        const get_hits = this._db.get('hits')
        if (get_hits){
            get_hits.push(Date.now())
            this._db.updateOne('hits',get_hits)
            return
        }else{
            this._db.set('hits',[Date.now()])
            return
        }
    }
}
export const database = new Database('data/count.json')
const counter = new Counter(database)

export default counter