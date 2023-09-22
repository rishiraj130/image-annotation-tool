import { useState } from 'react';
import _cloneDeep from 'lodash/cloneDeep';

import useKonva, { IMAGE_ASSET_NAMES } from './useKonva';

import './App.css';

const getSavedImageBoundingBoxList = (imageBoundingBoxList, imageIndex) => {
    const currentImageBoundingBoxList = imageBoundingBoxList[imageIndex] || [];
    const formattedImageBoundingBoxList = currentImageBoundingBoxList.map((rec) => {
        if(!rec?.isSaved && rec?.oldRecObj) {
            return { ...rec, isSaved: true, recObj: { ...rec?.recObj, attrs: { ...rec?.oldRecObj?.attrs }  } }
        }
        return { ...rec };
    })
    const confirmedBoundingBoxList = formattedImageBoundingBoxList.filter(rec => rec?.isSaved && !rec?.isToBeDeleted);
    return confirmedBoundingBoxList.map(rec => ({ ...rec, isIntentedToBeRemoved: false, oldRecObj: undefined }));
}

function App() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { imageBoundingBoxList, saveCurrentBoundingBoxes, setImageBoundingBoxList, handleBoundingBoxDeletion, generateJSON } = useKonva(currentImageIndex);


  const handlePreviousButtonClick = (imageIndex) => {
      imageBoundingBoxList[imageIndex] = getSavedImageBoundingBoxList(imageBoundingBoxList, imageIndex);
      console.log({ test1: getSavedImageBoundingBoxList(imageBoundingBoxList, imageIndex) });
      setImageBoundingBoxList([...imageBoundingBoxList]);
      setCurrentImageIndex(prevImageIndex => prevImageIndex - 1);
  }

  const handleNextButtonClick = (imageIndex) => {
      imageBoundingBoxList[imageIndex] = getSavedImageBoundingBoxList(imageBoundingBoxList, imageIndex);
      console.log({  test2: imageBoundingBoxList[imageIndex] });
      setImageBoundingBoxList([...imageBoundingBoxList]);
      setCurrentImageIndex(prevImageIndex => prevImageIndex + 1);
  }

  const getBoundingBoxList = () => {
      const currentImageBoundingBoxList = imageBoundingBoxList[currentImageIndex] || [];
      const boundingBoxListEligibleForDisplay = currentImageBoundingBoxList.filter(rec => !rec?.isIntentedToBeRemoved);
      return boundingBoxListEligibleForDisplay.map((rec) => {
          const recObj = rec?.recObj;
          const x = recObj?.attrs?.x || 0;
          const y = recObj?.attrs?.y || 0;
          const width = recObj?.attrs?.width || 0;
          const height = recObj?.attrs?.height || 0;
         return (
             <div className="boundingBoxDetail" key={recObj?.attrs?.id}>
                 <div className="boundingBoxInfoSection">
                     <div>
                         {`TopLeftCords: ${x}, ${y}`}
                     </div>
                     <div>
                         {`BottomRightCords: ${x + width}, ${y + height}`}
                     </div>
                 </div>
                 <div className="removeButton">
                     <button onClick={() => handleBoundingBoxDeletion(recObj?.attrs?.id)} type="button">Remove</button>
                 </div>
            </div>
         )
      });
  }

  return (
      <div className="appContainer">
          <div className="leftSection">
              <div className="imageContainer" id="imageContainer"></div>
              <div className="bottomNavigator">
                  {currentImageIndex!==0 && <button type="button" onClick={() => handlePreviousButtonClick(currentImageIndex)}>Previous Image</button>}
                  {currentImageIndex!==IMAGE_ASSET_NAMES.length-1 && <button type="button" className="nextButton" onClick={() => handleNextButtonClick(currentImageIndex)}>Next Image</button>}
              </div>
              <div className="saveSection">
                  <button type="button" onClick={saveCurrentBoundingBoxes}>Save Changes</button>
                  <button type="button" className="jsonButton" onClick={generateJSON}>Generate JSON Data</button>
              </div>
          </div>
          <div className="rightSection">{getBoundingBoxList()}</div>
      </div>
  );
}

export default App;
