from xml.dom import minidom
import re
import sys

skinPath = sys.argv[1] 
skinFile = open(skinPath,'r')
skin = minidom.parse(skinFile)
skinText = skin.toxml()
whiteSpace = re.compile('>(.*?)<', re.S)
skinText = whiteSpace.sub('><', skinText)

print(skinText) # python 3.4.2
