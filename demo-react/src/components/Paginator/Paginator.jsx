import React from 'react'
import ButtonPaginator from "./ButtonPaginator";
import './paginator.css'

const Paginator = ({selectPage, len, pageSize}) => {
    const tx = []
    for(let i = 0; i < Math.ceil(len/pageSize); i++){
        tx.push(i);
    }

    return <div className={'paginator'}>

        {tx.map((val, index)=>{
           return <ButtonPaginator key={val+index} selectPage={selectPage} pageNumber={val+1}/>
        })}


    </div>
}
export default Paginator