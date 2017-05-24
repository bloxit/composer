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
docker pull hyperledger/fabric-ccenv:x86_64-1.0.0-alpha

# Kill and remove any running Docker containers.
docker-compose -p composer kill
docker-compose -p composer down --remove-orphans

# Kill any other Docker containers.
docker ps -aq | xargs docker rm -f

# Start all Docker containers.
docker-compose -p composer up -d

# Wait for the Docker containers to start and initialize.
sleep 10

# Create the channel on peer0.
docker exec peer0 peer channel create -o orderer0:7050 -c mychannel -f /etc/hyperledger/configtx/mychannel.tx

# Join peer0 to the channel.
docker exec peer0 peer channel join -b mychannel.block

# Fetch the channel block on peer1.
docker exec peer1 peer channel fetch -o orderer0:7050 -c mychannel

# Join peer1 to the channel.
docker exec peer1 peer channel join -b mychannel.block

# Open the playground in a web browser.
case "$(uname)" in 
"Darwin") open http://localhost:8080
          ;;
"Linux")  if [ -n "$BROWSER" ] ; then
	       	        $BROWSER http://localhost:8080
	        elif    which xdg-open > /dev/null ; then
	                xdg-open http://localhost:8080
          elif  	which gnome-open > /dev/null ; then
	                gnome-open http://localhost:8080
          #elif other types blah blah
	        else   
    	            echo "Could not detect web browser to use - please launch Composer Playground URL using your chosen browser ie: <browser executable name> http://localhost:8080 or set your BROWSER variable to the browser launcher in your PATH"
	        fi
          ;;
*)        echo "Playground not launched - this OS is currently not supported "
          ;;
esac

# Exit; this is required as the payload immediately follows.
exit 0
PAYLOAD:
� `a%Y �][����3��:/��3����T�榨� �x��wo������d.��8�agW�R	H���굾�:�[7�'��ʍ��4��|
�4M�(M"�w���(�b����1��R#?�9����vZ�}Y��v��\��(�G�O|?�������4^f2".�?EH%�2��o���2.�?�Qɿ�Y�Ǔw���叒Vɿ\(����∽u4\.��������>[ǩ��@�\�$M�����5|��/��t9��gLĝ��s�=�  i�K��I�y�;��q��Y�����������E0��pʦ\�F�B�i�uH��=�E(�GH�G}�"̵�"]E|¿�>k�U�9ʐ�I�)�E����c�����RF�����Nl�jM�>��t��Xk�֩R�.4Q�e$�e���$X`�{+X�R\�ʦ�m�0R�?����_5�
�B ��@���c%�&�'pG���&�OQ4�!
�\gu���=���p:�JH�w��L�	k[�ˋY�E�[�~dK��B]��:5VT��^���������M����^��QY�������]����u�G���G	{j�q��������Eݐ%�/���e�i�<p�!�e���,%>���-3�x�\���2@���d>��4M 3.T�,�x�LMk�y�DC)Ё�sJ[ä���nD&�!N;�q;E`�F�{��3{�Μ��+�9y��n�\�sv?>�;� =.TM(���Q��F�N�$"�J��Q�x$rqMޫ��k�%���-�(�i*;� t�|������i,"om졸�f`p.s�,ʦ\Í���-�ܷ
�@��Y����_1��㡹7��R1���)n�M�'
�N

�8�WňP�<�9���n$�)a7�a/�-��bc���9}���)�h'�rVr�P����]i�Y&n��Vw�t3עf��)�8��'�"�xy2�S4�E�������J�ϕ%(��}��t9^eu�Ș��6|#;��a��l�E�$m.o4F�t�4W���%�(‗5����e�Ob`���1f��:���a�����w�\��$mIm45Q�u�!�%�H�X4�9����l���܆g�����r�K�?��o����?�U�_
>H���?�^��)�c�OP�x���Y��Nt��:PC��f{��W�d�%��'�s>��v<�3�H'B�~Ĩ�*�#F};��rd��A��`� �ŵ���^����I���:?�2��4]�!����b��p��#v�D���[�NeM1GkH���5q"5q1u{W���~o�yl��W�y.�V�ӊ������2ti��4Z���˶:U �U��ք9P�m�0<z GZoi�rf�m qyQ��+ ���t��k��k��Aȁ3_�A7��}���|Ƿ4�צ����4���A#�9�u �-�5�.��̶��	�4���qG�"j>ob��bM�GAn�{�I���sn
��L�k�t���mfՇJ&�����)~������]��C�U�G)���,�����h���2P��U�_���?����9�������_��g��T�_)�����_�ҧ� 'Q���f������); 	h�e0�u(��%�q�#�*���B�%��Q�E�U�W.����=q�w4)h��Hc=A]f��\������F��/���ec�m+��qCN���o�|�-[ʰ�l��a��%ǜ�L7�t;��=�csc����
p;�nX@�$�m��=�������3����R�Q�������e���������j��]��3�*�/$�G�?$����J������ߛ9	�G(L���.@^����`���W�%��7kpl�L̇0�н�4��ށ
��*@�tb�I�7���txs�;��H��H�\u:w��f�z3�7l�k���AS�(^��BA�:ܠ�ɪc��,�=Ѻ�i[<2.g�cFґ����9��A�6h�p*4�	Cr��}El	`�8�v�vS4���MV&�����-�3�q�|�0�ٓA�28	LE5�xǰW�|h֣�ZLB6ޮ;-�mvZgiϔ��uG=��f�TS�%������d�R$/k7t !s���IV=h��x��_�����C������g��T�_
�����������l�]��[�]��h����%���_�����Ǌ��@���W��������R�}�#	�*��\��c�^���`h@��C0���xκ��8�0,���0��(͒$eWY~�ʐ���]����+���L���j�*�7�[c�`��Ǟ#���~����� ���P�;aw괒RCCrG�v��|�a�' �؍r��*mw;p{G��=1@<Z���&#���9���n7���ލ�����~����h��U�_
� ��߹�;��j��rp��o�/3
��'�J�K�{���������r��8FU�/)����^,�✮�����a�����?�j��|���4B�?��9�m�.cS,����{.����a�G#�n�8K0A��6˰>ZM��2�������>��t����0Qx1�v�z���`�]��c��F����_��Yh����8��u��RTO�È�<j̄�]��kF�A��!�Sn;�"l�z&⚠:����l���y7>R�_Z��� �����JO�?
�+��|��?(�4[�B�(C�������M*������>�y����;b%�A�*�5��`����l������п��c�ㆹ��T��bx�T�޺��p#s�m��}�֣}�����߻4��i�M;�L(�|�#�S:E_̋W�Km;��~�HLW���	�<�-b�Zt3����������P�YOԉ5�����j�s�ފ���{�A3Q�t�r֓��ex�L>2�kĠ��Ām���N��-�x�s�[SW�u��ք~ހNYe�6�xN�/ݩ�۝�ؐ�����^��.uF$��m�,O7|���0�v�X���M�i����o�)��足��Y�9ˌ������mo9�� ����N�ʹ��\��ފ��>�[Z��>\d��BiH�?/�#��K������X��������������9����*�-Q��_�����$P�����m�G�~�Ǹ0l�^�-��If�����l�G���?�e~��Q~(�b�n!�[ׁ�����<�Z�� 컦�O����~Ѓ!c;9�ݔ����E%qG4�f#�e�\k�-[�)Ѷw�o�T�]K�t*�1I�4�.�S��]K$�_����4^�z�!����8��Х��cw �5�͑��hmւg�.��}{��Y#Yͥ.���d.���j�l��;�j��7|��N�aFHt��*�>=l<����O����� .������J�o�����?��?%�3��������g���������������j�������.0��X����K���ܻ����#U�����+��������b������T��V
.��#l��0�D)ơH�p�g0�D|g4�iGp%2`}*�}�\së]`~+�!�W����BR��O)�`�PZ�d��a�2�f�����9��6ض��"o䑶hQ����hN�m�`]	otw�K��#`����;V�DI�1�ַ����0�k�d=�(G��b(���:�b��W��/v�~Z��ę������?zZ��x�E���*[?�
+����e~���~���\9j�id����d������B�I��k�1�E\���5re/��}����N�x����&��UM�.�7<�iv��]��w�:��OO_L�t�}�ǿh�$�����Z1p#{�}�e�ڕ[���=jG�kWŕ��lE0]��W��d?������e�����jWN�������$��v坺`/6������Kvu��ַ����ڞ.��fiGŨp훻�AE�[_�v�<�|W�ʰ��v���ꂨ��MCTEtn:r�U ���C�O^�}<��"ͮ��(�תJr�#��Q����8���W�v��}��]t�~O�u�_(>�Z[���-����a{�F�S���w���/{�yˤ�>�zq�W5��zT��fw��ӻ�ݮ�������V�������k~�i������;55���t�x��k��5Ɖ���Y���t=�8ׅ����=�ڽU{x�%,l r4�ȏ���<W�����G���G>��cO��c�p*z�6�\d��.��M �|Wođ�ѐ�;0��G�q]U����|�T
�z]Y5�m���W�'q���v
��%|������~�fO,�m���_�qQqۮ�?��u���]m��d���rx.\%�� �1����뺗�u�麭{ߔ\{���֭=�މ	jBL0�%h�$h�����~R�4��H���#
1Q?�m��lg�9;�����=�������������<�r3(! ��+������lt1<��d�$3�X�R2��q�ږ�c��'�k ��fz_��	<nuݾ��Ӭ��E��a�{�h6�A�d����&�p�]L��Î��;��$�=�n��Dsp�n�\�wBs�-3���u� �R-�m����L�,��V4]7um����8cg֋���;�$(���d&;�!���d��u�����
_e;R���,��p��>��kF��qQfMi�<"�*��@�t6ZV{߬�s�<�J��Ґ1˨�
ߪh�t�j��E��Y���Ma��M��4�"G�ӥ�l8���hpꛃS�N��N'	#?��i>���:��b'�/*;T�Ӫ,��{0����3M��S�9�uPM�!ˠ�Hҩ��#U��q���Yg�Soe�猞N���"�9�eDi�ssW�kF���2�+Q�5N�)F�`t������Շ��|m]p|�.2Y��<+e���)]����{�*wQ�h.P��R�$
l����@]�9�Z�+7��9��ˑ~�S{����|U2�-�
�ÍF1���|vOڃsэ\��M��ɏ9)�:b!Cf<�Kp���:��2b�f�mN�4��6Z�w:��Υ�Sm�}C�+���wu�^�]�_�nu�z!G���^{�#Xvu�NN�+zQ5�g�f�Ш�8��\^ �=���aaý���U���ܨ���������������8x�Nl�Z{�ߏ��j絖J\x`���.��П`,��E�U�uc�^�G�׳��V]����*���#��C9=�����Cgoo�vǙ_���ح��wO<����ڥG��9�
<C��B7����9�5�@8�C'��� ��š����9p�q��9���'��\���H�A���>=�Ծ�_���d}����Y�<0"�Ὠ�%�,ף��m��$^3M�M��i~"�{X���;��l�Fa��^����j3������c��[�6p��gH���"��vz�p�6�, �NY���/���Ur��a���y����झ���b4^2H|��͜l�,�I"�6:��s���*�a����t��v����d��"Y��no͢ʤ����il����LH���V��{�o��\�r��bB�3p)(��BB�*��L�l>��^JM)p�뭗B���~�>��S6�f��L�U����"�v�@Xj_�Om�#���'8$�f����bX{j���[�[��kJ6�ƃ��VqW<�$��6�.s����8��+�(Dsy��V�'�ܑPR̄�l��'$ q8d%�a�I#�r
fZp$B�H��Z>�!���1��9d�;�M����V!�Jj���v�V,�#�?�4Y��y�ZJ�Q�\����a�����`��N��\��w�C>?�D��F��W��1)˒Xg�e˝��u�@�Kq��R2��D���L~( �j�@�~�kE��`�n�H�_	��X1��T��D[i�"T�����MNYpF��ZQ�"t�����i��3-)5�,{�gd�*KT��!_���}C�к|�nX9��0vu"Q9�	Ǜ��#����bλU�~p	�T2R�#�&S��
դ�K�}�����*Kl���(Ke���,Q4��
��*\%I��B����Bg�5s����4Ϸ��P�jW�Eyk'�N+�*op;�;�Ĥ� r�}8e	�ɚDp/��2Hz#LʕΔ9�S�=�3�K��	m�ޡ�{[�Z��BI`�7�ҽ��� XB�y�	7�C��[ �ِ���kM�kR��)�=C1�M�l9�nO��i0�)����l����V��6N�F�Os����Zk�}:�v%��A���'֮�8]7�*me��tr買O�Y��L�Y�r��4�VU��]� ��D#�.w�Ѝ�5�j����,���B���A)Y�q�&�Fp�q���%i��q'���Ҽ�Vk�WZ�*�zBO�[ZG�Z�N���,ɖ�\k�&S�����5�����!g~�a5�iu�Y���U��^?a�\ 7
`��j���-�����㘺��m��8aZf���z�<8�+����9��3�=m �@�e��x�AN�, �j3����r���ou�#7�"/o�Co�C[߽��R`���R���C�h����� �"	���t�B��[��g+;��p�Z�H����Ƣ���h�0�%k8z�`�K{�8�NjLOc�ZS��{��A$�D��)��M��/�^��F,�J�.�▖h��D+�DCH�C�^��B"(t���-��G�s���I�+���a�B�S�C#{0p ���-&��|���q�����xH7��51"�%j���A�!�no<�`UW��b4SˑL#�a0җ����}B�.P����������a҂]�+[�k�a��9��!�	�}��-Q�")D�#��u�LS &�Co9���>.մb/��}��i�m�q�Ǻv�����t��)�������i�����ݡ�:��z贕a��xX�=,��[�O���޿���,�I��D�VD2S��Q
W�H���\���1/;���@����3�<X��u��E��$&���
��"�՚����x[��3��0jSI`bJى�!2(��d
G�vJ�Ԗ+�0���������]&�xY�p#�QnO���0<�}Q8]JI���t0do,6�!
��<��.�	�[j���g��;(EyrHԕ(t��+}t���<@�^�,���G��U����I^�È�2	��g�~����%��;��&&�$ι �ɒ�V��r�n���]�z��]�ye�6�8�ߌ�Pޏ{6ⷒS�>�S6�c���J!��l��f�.Ķ�(�����i���Q�h����)��qD�TT^�xM���3|^K�<X��Yo�؄ h��Dq��w���z��8�Q%�y��N@WXn�E`1�^}�on�^�����^z������������5�aͮ�=}��n�1{,��~�e��D�{���6�����x��?��A������/@7�~ ~�߼�/>���ȟ�?	}/����āܺv���k�2���ۼ6�NT�@��7⟿�{拍�I7�����˿��o|�I�u
�FA��?MQ;_pBo�R;_���6�Ӧv�4�&`S;�������v@�H��N��iS;m�������C�-/#��!H���@��,a�f��	��k�m�����@=�x�1C'}�~���צ�	/B6��v�l���)���j�l㰍�=��#y��� 3X��kS�l�yZ��;�jϙ�����93�q��q��a����\��9�;w��ڪ��w�<z�d���Z������������_?�~  