import React from 'react'


const ButtonPaginator = ({selectPage, pageNumber, tokenType}) => {


    return <div>
        <button onClick={()=>selectPage(pageNumber, tokenType)}>{pageNumber}</button>
    </div>
}
export default ButtonPaginator