import React from 'react'


const ButtonPaginator = ({selectPage, pageNumber}) => {


    return <div>
        <button onClick={()=>selectPage(pageNumber)}>{pageNumber}</button>
    </div>
}
export default ButtonPaginator