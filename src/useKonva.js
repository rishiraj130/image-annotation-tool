import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import _cloneDeep from 'lodash/cloneDeep';

import Konva from 'konva';

import image1 from './assets/image_1.jpg';
import image2 from './assets/image_2.jpg';
import image3 from './assets/image_3.webp';
import image4 from './assets/image_4.jpg';
import image5 from './assets/image_5.jpg';

const IMAGE_ASSETS = [
    image1,
    image2,
    image3,
    image4,
    image5,
];

export const IMAGE_ASSET_NAMES = [
    "image_1.jpg",
    "image_2.jpg",
    "image_3.webp",
    "image_4.jpg",
    "image_5.jpg"
];

const removeAllTransformers = (layer) => {
    layer.getChildren().forEach((rec) => {
        if(rec instanceof Konva.Transformer) {
            rec.destroy();
        }
    });
}

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}



export const useKonva = (currentImageIndex) => {
    const layerRef = useRef(null);
    const currentTransformerRef = useRef(null);
    const [imageBoundingBoxList, setImageBoundingBoxList]  = useState([]);


    useEffect(() => {
        var stage = new Konva.Stage({
            container: 'imageContainer',
            width: 600,
            height: 600,
        });

        var layer = new Konva.Layer({ draggable: false });
        stage.add(layer);

        layerRef.current = layer;

        const imageObj = new window.Image();
        imageObj.src = IMAGE_ASSETS[currentImageIndex];
        imageObj.onload = () => {
            const image = new Konva.Image({
                image: imageObj,
                width: 600,
                height: 600,
            });
            layer.add(image);
            image.moveToBottom();
        };


        var containerRec = new Konva.Rect({ id: 'containerRec', x: 0, y: 0, width: 600, height: 600 });
        layer.add(containerRec);

        var boundingBox = new Konva.Rect({ x: 0, y: 0, width: 0, height: 0, stroke: 'red', strokeWidth: 4 });
        boundingBox.listening(false);
        layer.add(boundingBox);

        const currentImageBoundingBoxList = imageBoundingBoxList[currentImageIndex];
        if(currentImageBoundingBoxList) {
            currentImageBoundingBoxList?.forEach(rec => {
                const currentRecId = rec?.recObj?.attrs?.id;
                var newRect = new Konva.Rect({
                    id: rec?.recObj?.attrs?.id,
                    x: rec?.recObj?.attrs.x,
                    y: rec?.recObj?.attrs.y,
                    width: rec?.recObj?.attrs.width,
                    height: rec?.recObj?.attrs.height,
                    stroke: 'red',
                    strokeWidth: 4,
                    draggable: false,
                });

                newRect.on('transformend', (evt) => {
                    const currentTransformerInstance = currentTransformerRef.current;
                    currentTransformerInstance.nodes([]);
                    currentTransformerInstance.destroy();
                    const currentRecId = evt?.target?.attrs?.id;
                    evt?.target?.width(Math.round(evt?.target?.width() * evt?.target?.scaleX()));
                    evt?.target?.height(Math.round(evt?.target?.height() * evt?.target?.scaleY()));
                    evt?.target?.scaleX(1);
                    evt?.target?.scaleY(1);
                    setImageBoundingBoxList(prevImageBoundingBoxList => {
                        const clonedList = [...prevImageBoundingBoxList];
                        const currentImageBoundingBoxList = clonedList[currentImageIndex] || [];
                        clonedList[currentImageIndex] = currentImageBoundingBoxList.map(rec =>  {
                            if (rec?.recObj?.attrs?.id === currentRecId) {
                                return { ...rec, isSaved: false };
                            }
                            return { ...rec };
                        });
                        return [...clonedList];
                    });
                });
                layer.add(newRect);
                setImageBoundingBoxList(prevImageBoundingBoxList => {
                    const clonedList = [...prevImageBoundingBoxList];
                    const currentImageBoundingBoxList = clonedList[currentImageIndex] || [];
                    clonedList[currentImageIndex] = currentImageBoundingBoxList.map(rec =>  {
                        if (rec?.recObj?.attrs?.id === currentRecId) {
                            return { ...rec, recObj: newRect  };
                        }
                        return { ...rec };
                    });
                    return [...clonedList];
                });
            });
        }

        stage.draw();
        var posStart;
        var posNow;
        var mode = '';

        function startDrag(posIn) {
            posStart = { x: posIn.x, y: posIn.y };
            posNow = { x: posIn.x, y: posIn.y };
        }

        function updateDrag(posIn) {
            posNow = { x: posIn.x, y: posIn.y };
            var posRect = reverse(posStart,posNow);
            boundingBox.x(posRect.x1);
            boundingBox.y(posRect.y1);
            boundingBox.width(posRect.x2 - posRect.x1);
            boundingBox.height(posRect.y2 - posRect.y1);
            boundingBox.visible(true);
            stage.draw();
        }

        containerRec.on('mousedown', function(e){
            mode = 'drawing';
            startDrag({ x: e.evt.layerX, y: e.evt.layerY })
        })


        containerRec.on('mousemove', function(e){
            if (mode === 'drawing'){
                updateDrag({ x: e.evt.layerX, y: e.evt.layerY })
            }
        })

        containerRec.on('mouseup', function(e){
            mode = '';
            boundingBox.visible(false);
            var newRect = new Konva.Rect({
                id: uuidv4(),
                x: boundingBox.x(),
                y: boundingBox.y(),
                width: boundingBox.width(),
                height: boundingBox.height(),
                stroke: 'red',
                strokeWidth: 4,
                draggable: false,
            });

            newRect.on('transformend', (evt) => {
                const currentTransformerInstance = currentTransformerRef.current;
                currentTransformerInstance.nodes([]);
                currentTransformerInstance.destroy();
                const currentRecId = evt?.target?.attrs?.id;
                evt?.target?.width(Math.round(evt?.target?.width() * evt?.target?.scaleX()));
                evt?.target?.height(Math.round(evt?.target?.height() * evt?.target?.scaleY()));
                evt?.target?.scaleX(1);
                evt?.target?.scaleY(1);
                setImageBoundingBoxList(prevImageBoundingBoxList => {
                    const clonedList = [...prevImageBoundingBoxList];
                    const currentImageBoundingBoxList = clonedList[currentImageIndex] || [];
                    clonedList[currentImageIndex] = currentImageBoundingBoxList.map(rec =>  {
                        if (rec?.recObj?.attrs?.id === currentRecId) {
                            return { ...rec, isSaved: false };
                        }
                        return { ...rec };
                    });
                    return [...clonedList];
                });
            });

            layer.add(newRect);
            stage.draw();
            setImageBoundingBoxList(prevImageBoundingBoxList => {
                const clonedList = [...prevImageBoundingBoxList];
                const currentImageBoundingBoxList = clonedList[currentImageIndex] || [];
                clonedList[currentImageIndex] = [...currentImageBoundingBoxList, { recObj: newRect, isSaved: false }];
                return [...clonedList];
            });
        })


        stage.on('tap click', evt => {
            removeAllTransformers(layer);
           if (evt.target instanceof Konva.Rect && evt?.target?.attrs?.id !== 'containerRec') {
               const currentRecId = evt?.target?.attrs?.id;
               setImageBoundingBoxList(prevImageBoundingBoxList => {
                   const clonedList = [...prevImageBoundingBoxList];
                   const currentImageBoundingBoxList = clonedList[currentImageIndex] || [];
                   clonedList[currentImageIndex] = currentImageBoundingBoxList.map(rec =>  {
                       if (rec?.recObj?.attrs?.id === currentRecId && !rec?.oldRecObj) {
                           return { ...rec, oldRecObj: _cloneDeep(rec?.recObj),  };
                       }
                       return { ...rec };
                   });
                   return [...clonedList];
               });
               var transformer = new Konva.Transformer({  rotateEnabled: false });
               currentTransformerRef.current = transformer;
               layer.add(transformer);
               transformer.nodes([evt.target]);
           }
        })


        function reverse(r1, r2){
            var r1x = r1.x, r1y = r1.y, r2x = r2.x,  r2y = r2.y, d;
            if (r1x > r2x ){
                d = Math.abs(r1x - r2x);
                r1x = r2x; r2x = r1x + d;
            }
            if (r1y > r2y ){
                d = Math.abs(r1y - r2y);
                r1y = r2y; r2y = r1y + d;
            }
            return ({ x1: r1x, y1: r1y, x2: r2x, y2: r2y}); // return the corrected rect.
        }

    }, [currentImageIndex]);

    const saveCurrentBoundingBoxes = useCallback(() => {
        const currentImageBoundingBoxList = imageBoundingBoxList[currentImageIndex];

        if (!currentImageBoundingBoxList) {
            window.alert('Nothing to save');
            return;
        }
        imageBoundingBoxList[currentImageIndex] = currentImageBoundingBoxList.map(rec => {
            if(rec?.isIntentedToBeRemoved) {
                return {...rec, isToBeDeleted: true, isSaved: true };
            }
            return {...rec, isSaved: true  };
        });
        setImageBoundingBoxList([...imageBoundingBoxList]);
    }, [imageBoundingBoxList, currentImageIndex])


    const handleBoundingBoxDeletion = useCallback((recIdToRemove) => {
        const layer = layerRef.current;
        const childrenToDestroy = layer.getChildren().filter(child => child?.attrs?.id === recIdToRemove);
        childrenToDestroy.forEach(child => child.destroy());
        layer.draw();
        const currentImageBoundingBoxList = imageBoundingBoxList[currentImageIndex] || [];
        imageBoundingBoxList[currentImageIndex] = currentImageBoundingBoxList.map((rec) => {
            if (rec?.recObj?.attrs?.id === recIdToRemove) {
                return { ...rec, isIntentedToBeRemoved: true };
            }
            return { ...rec };
        });
        setImageBoundingBoxList([...imageBoundingBoxList]);
    }, [currentImageIndex, imageBoundingBoxList]);

    const generateJSON = useCallback(() => {
        const result = imageBoundingBoxList.reduce((acc, boundingBoxList, imageIndex) => {
            const formattedImageBoundingBoxList = boundingBoxList.map((rec) => {
                if(!rec?.isSaved && rec?.oldRecObj) {
                    return { ...rec, isSaved: true, recObj: _cloneDeep(rec?.oldRecObj) };
                }
                return { ...rec };
            })
            const savedBoundingBoxList = formattedImageBoundingBoxList.filter(rec => rec?.isSaved && !rec?.isToBeDeleted);
           const formattedBoundingBoxList = savedBoundingBoxList.map(rec => {
               const recObj = rec?.recObj;
               const x = recObj?.attrs?.x || 0;
               const y = recObj?.attrs?.y || 0;
               const width = recObj?.attrs?.width || 0;
               const height = recObj?.attrs?.height || 0;
               return {
                   'x1': x,
                   'y1': y,
                   'x2': x + width,
                   'y2': y + height,
               }
           })
            acc[IMAGE_ASSET_NAMES[imageIndex]] = formattedBoundingBoxList;
            return acc;
        }, {});
        downloadObjectAsJson(result, 'data');
    }, [imageBoundingBoxList]);


    return {
        imageBoundingBoxList,
        saveCurrentBoundingBoxes,
        setImageBoundingBoxList,
        handleBoundingBoxDeletion,
        generateJSON,
    }
}

export default useKonva;