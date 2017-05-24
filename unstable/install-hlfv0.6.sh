(cat > composer.sh; chmod +x composer.sh; exec bash composer.sh)
#!/bin/bash
set -ev

# Get the current directory.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get the full path to this script.
SOURCE="${DIR}/composer.sh"

# Create a work directory for extracting files into.
WORKDIR="$(pwd)/composer-data"
rm -rf "${WORKDIR}" && mkdir -p "${WORKDIR}"
cd "${WORKDIR}"

# Find the PAYLOAD: marker in this script.
PAYLOAD_LINE=$(grep -a -n '^PAYLOAD:$' "${SOURCE}" | cut -d ':' -f 1)
echo PAYLOAD_LINE=${PAYLOAD_LINE}

# Find and extract the payload in this script.
PAYLOAD_START=$((PAYLOAD_LINE + 1))
echo PAYLOAD_START=${PAYLOAD_START}
tail -n +${PAYLOAD_START} "${SOURCE}" | tar -xzf -

# Pull the latest Docker images from Docker Hub.
docker-compose pull
docker pull hyperledger/fabric-baseimage:x86_64-0.1.0
docker tag hyperledger/fabric-baseimage:x86_64-0.1.0 hyperledger/fabric-baseimage:latest

# Kill and remove any running Docker containers.
docker-compose -p composer kill
docker-compose -p composer down --remove-orphans

# Kill any other Docker containers.
docker ps -aq | xargs docker rm -f

# Start all Docker containers.
docker-compose -p composer up -d

# Wait for the Docker containers to start and initialize.
sleep 10

# Open the playground in a web browser.
case "$(uname)" in 
"Darwin")   open http://localhost:8080
            ;;
"Linux")    if [ -n "$BROWSER" ] ; then
	       	        $BROWSER http://localhost:8080
	        elif    which xdg-open > /dev/null ; then
	                 xdg-open http://localhost:8080
	        elif  	which gnome-open > /dev/null ; then
	                gnome-open http://localhost:8080
                       #elif other types bla bla
	        else   
		            echo "Could not detect web browser to use - please launch Composer Playground URL using your chosen browser ie: <browser executable name> http://localhost:8080 or set your BROWSER variable to the browser launcher in your PATH"
	        fi
            ;;
*)          echo "Playground not launched - this OS is currently not supported "
            ;;
esac

# Exit; this is required as the payload immediately follows.
exit 0
PAYLOAD:
� `a%Y �[o�0�yx��д��$
)E�$��)
�^s�si���>;e����R�i����s|αq���xa���sk���r������3$I�5QE�-CQ�kP�P�����I��" �bb�8:�{����"��W@�]?�I��"� y+�#��� ���F
�lCD\���v3�|��M�ӄ-�%6C�R���a@��e" ��q	/:
�42�SL�C~|M�ɵ��ڲo�{f���i�z��1IP&�m�Y��䢥�4���"D�-d��F�&2�X����]�I�&�f�����sU���`����[��j�}�ֽp9���g���M|����ZD �/8�vnE�V4������Ku��׋a��G�.M^�c�yd��s`7WqV�z����g#t���F�]��$�l<��Q����諦���]��ڷ$\����C�!
ݖ��h�6hD.B!��X�?p`�L��i�&��VU<�DEw�49�߿�е�k$�S��W�
*�ҨZ`>OG��h��l2�鴊���f4T�����' �v��Ȏ�q3'�=vQTW

�ٸ/;��>���4��
E6�!��n�! ���<.����e��.-W��i�M�}���>�6A�
�ܨ<�.��Cv���tk�t5|y�K�!�cPY�R�m���KUi�`��±��K�D�O�T$Ϲ���B�s�yS�-��Y!�&�Q�.>|A�~��g������p8���p8���p8���p8���'k�;M (  