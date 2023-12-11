const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();     // This sets up the .env file to make the environment variables specified within accessible
const { Client } = require("@notionhq/client")


/**
 * @abstract manipulation functions for a spacific page. 
 */
class NotionOperations{

    constructor(pageID){
        this.pageFocus = pageID;
        this.notion = new Client({
            auth: process.env.API_KEY
        })
    }
    changePageId(id){
        this.pageFocus = id;
    }
    #doesPageIDExist(){
        if(this.pageFocus === undefined){
            throw new Error("page id does not exist");
        }
    }
    #contentIsNotEmpty(obj){
        if(obj.results === undefined || obj.results.length === 0){
            throw new Error("There is no content in the page.");
        }
        return obj.results;
    }

    async getProperties(id){
        const response = await this.notion.blocks.retrieve({
            block_id: id,
        });
        return response;
    }

    /** 
     * @abstract take an object and return only the id and the core data it holds
     * @param {{id: "string", _someCoreData: *}} obj 
     * @return 
    */
    #extractCoreDataAndType(obj){
        const reFormat = {type: obj.type, data: null};
        
        if(obj.plain_text !== undefined && reFormat.data === null){
            reFormat.data = obj.plain_text;
        }
        if(obj.paragraph !== undefined && reFormat.data === null){
            reFormat.data = obj.paragraph;
        }
        if(obj.link_preview !== undefined && reFormat.data === null){
            reFormat.data = obj.link_preview;
        }
        if(obj.table !== undefined && reFormat){
            reFormat.data = obj.table;
        }
        if(reFormat.data === null){
            throw new Error(`No such core data specified: ${obj.type}`);
        }
        // console.log(reFormat)
        return reFormat;
    }
    
    /** 
     * @abstract get all the blocks in a block id (blocks also include pages);
     * @param {string} id  receive id of the block
     * @condition if id is null, use the default id (this.pageFocus);
     * @returns {obj} key = id of blocks, values = {type: '', data: *};
    */
    async #getBlocks(id=null){
        const data = await this.notion.blocks.children.list({
            block_id: id === null ? this.pageFocus : id
        });
        const reformat = {}
        const length = data.results.length;
        for(let i = 0;i<length;i++){
            reformat[data.results[i].id] = this.#extractCoreDataAndType(data.results[i]);
        }
        return reformat;
    }
    
    /** 
     * @abstract filter the obj filled with key block data from #getBlocks for those of a particular type
     * @param {string} type
     * @returns {obj} key = id of blocks, values = {type: '', data: *};
    */
    async filterForType(type){
        const blocks = await this.#getBlocks();
        console.log(blocks)
        const filtered = {}
        for(const id in blocks){
            if(blocks[id].type === type){
                filtered[id] = blocks[id];
            }
        }
        return filtered;
    }

   
    
}


const x = new NotionOperations("fd0e8c50418f4360b512be4b5303d5cf")
// x.getSpecificType("table_row").then(res=>{
//     console.log(res);
// });
// x.getAllSimpleTableContents().then(res=>{
//     // console.log(res)
// })

// x.getAgetPageBlocks().then(res=>{
//     console.log(res);
// })

// x.getProperties('38ee7af51a8c4342b4b5404fab468ab3');
x.filterForType("table").then(res=>{
    console.log("THIS: ",res)
})

class simpleTableManipulation{
    /**
     * Creates an instance of simpleTableManipulation.
     * @param {string} id   table block id              ->     e7ca1696-f5d4-40be-b2c2-810bc9acb684
     * @param {{table_width: integer, has_column_header: boolean, has_row_header: boolean}} data  the core data for table type    ->     { table_width: 3, has_column_header: true, has_row_header: false }
     * @sourceMethod NotionOperations -> filterForType()    This method produces a data format that is needed for operations within this class.
     * @memberof simpleTableManipulation
     */
    constructor(id,data){
        this.id = id;
        this.data = data;
        this.notion = new Client({
            auth: process.env.API_KEY
        })
        this.#checkInitialisationInput(id,data);
    }
    
    #checkInitialisationInput(id, data){
        if(typeof id !== "string" || typeof data !== "object"){
            throw new Error("Class instance initialization input is not the correct data type.")
        }
        if(data.table_width === undefined || data.has_column_header === undefined || data.has_row_header === undefined){
            throw new Error("data parameter keys are not in the correct format: {table_width: number, has_column_header: boolean, has_row_header: boolean}")
        }
    }

    #extractSingleCellCoreData(obj){
            if(obj.plain_text === undefined){
                return null;
            }
            return obj.plain_text;
    }
    /**
     *
     * @abstract Get an array of objects, with each object representing a table row. 
     * @return {*} 
     * @memberof simpleTableManipulation
     */
    /* Expected output example:
            [
                {
                    object: 'block',
                    id: 'adf7707e-a974-4698-9d24-5dab1c138d39',
                    parent: {
                    type: 'block_id',
                    block_id: 'e7ca1696-f5d4-40be-b2c2-810bc9acb684'
                    },
                    created_time: '2023-12-10T06:44:00.000Z',
                    last_edited_time: '2023-12-10T06:46:00.000Z',
                    created_by: { object: 'user', id: '6ce77016-7de8-4b03-b0fd-565cb7054e8c' },
                    last_edited_by: { object: 'user', id: '6ce77016-7de8-4b03-b0fd-565cb7054e8c' },
                    has_children: false,
                    archived: false,
                    type: 'table_row',
                    table_row: { cells: [Array] }
                },
                {...},
                {...}
            ]
    */
    async #retrieveSimpleTableComponents(){
        const list = await this.notion.blocks.children.list({
            block_id: this.id
        });
        return list.results;
    }
    /**
     * @abstract 
     * @param {{}} obj
     * @return {*} {columnNumber: data, ....}
     * @note 
     *      - Where to get the input from?                                                  ->      retrieveSimpleTableComponents()  -> A single object in the array.
     *      - In a single row, how many layers of arrays must you penetrate through?        ->      2 layers                         -> closeToCore[i][0]
     * @memberof simpleTableManipulation
     */
    /* Expected input example:
        {
            object: 'block',
            id: 'fe4695b9-8748-4624-a308-880705dbcff4',
            parent: {
                type: 'block_id',
                block_id: 'e7ca1696-f5d4-40be-b2c2-810bc9acb684'
            },
            created_time: '2023-12-10T06:32:00.000Z',
            last_edited_time: '2023-12-10T06:32:00.000Z',
            created_by: { object: 'user', id: '6ce77016-7de8-4b03-b0fd-565cb7054e8c' },
            last_edited_by: { object: 'user', id: '6ce77016-7de8-4b03-b0fd-565cb7054e8c' },
            has_children: false,
            archived: false,
            type: 'table_row',
            table_row: { cells: [ [Array], [Array], [Array] ] }
        }
    */
    /* Expected output example:
        { '0': 'Project', '1': 'Description', '2': 'Link' }
    */
    #extractSingleTableRowData(obj){
        // console.log("THIS: ",obj)
        if(obj.type !== 'table_row'){
            throw new Error("Cannot extract single table row if input is not table_row type.")
        }
        const raw = {}
        const closeToCore = obj.table_row.cells
        
        const rowLength = this.data.table_width;
        for(let i = 0;i<rowLength;i++){
            const current = closeToCore[i];
            if(current.length === 0){
                raw[i] = null;
                continue;
            }
            const coreData = this.#extractSingleCellCoreData(current[0]);
            raw[i] = coreData;
        }
        return raw;
    }
    
    async extractSimpleTableContents(){
        /* 
            1. Get everything first
            2. Check if there is a header
                2.1. If yes
                    - Use the header as the keys for each column in each row.
        */
        const rows = await this.#retrieveSimpleTableComponents();
        const length = rows.length;
        const simplified = [];
        for(let i = 0;i<length;i++){
            const currentRow = rows[i];
            const extractCoreData = this.#extractSingleTableRowData(currentRow);
            simplified.push(extractCoreData);
        }

        // convert
        if(this.data.has_column_header){
            const NewLength = simplified.length;
            const header = simplified[0];
            const ending = {}
            for(const id in header){
                ending[header[id]] = []
                for(let i = 1;i < NewLength;i++){
                    ending[header[id]].push(simplified[i][id]);
                }
            }
            return ending;
        }else{
            return simplified;
        }   
    }
}

const y = new simpleTableManipulation('e7ca1696-f5d4-40be-b2c2-810bc9acb684',{ table_width: 3, has_column_header: true, has_row_header: false })
