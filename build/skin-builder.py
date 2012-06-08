import base64
from xml.dom import minidom
import re

basePath = '../../../skins'
skinName = 'six'
skinPath = basePath + '/' + skinName + '/src/' + skinName + '.xml'
skinFile = open(skinPath,'r')
skin = minidom.parse(skinFile)
components = skin.getElementsByTagName('component')
for component in components:
	componentName = component.attributes['name']
	elements = component.getElementsByTagName('element')
	for element in elements:
		elementPath = basePath + '/' + skinName + '/src/' + componentName.value + '/' + element.attributes['src'].value
		imageText = base64.b64encode(open(elementPath,'rb').read())
		element.attributes['src'].value = 'data:image/png;base64,' + imageText
skinText = '\''+skin.toxml()+'\''
whiteSpace = re.compile('>(.*?)<', re.S)
skinText = whiteSpace.sub('><', skinText)

outputPath = skinPath = basePath + '/' + skinName + '/' + skinName + '-min.xml'
outputFile = open(outputPath,'w')
outputFile.write(skinText)
outputFile.close()
